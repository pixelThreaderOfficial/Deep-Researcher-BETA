use once_cell::sync::Lazy;
use reqwest::{Client, Response};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::Emitter;
use tokio::sync::mpsc::{UnboundedReceiver, unbounded_channel};
use tokio::task::JoinHandle;
use uuid::Uuid;

// Base URL for local Ollama
static OLLAMA_BASE_URL: &str = "http://127.0.0.1:11434";

// Global HTTP client
static HTTP_CLIENT: Lazy<Client> = Lazy::new(|| Client::builder().build().expect("reqwest client"));

// Registry of running tasks so we can cancel by id
static RUNNING_TASKS: Lazy<Arc<Mutex<HashMap<String, JoinHandle<()>>>>> =
    Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {    
    pub role: String, // "user" | "assistant" | "system"
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateResult {
    pub response: String,
    #[serde(default)]
    pub done: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatStreamChunk {
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub message: Option<ChatMessage>,
    #[serde(default)]
    pub done: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TagModelEntry {
    pub name: String,
    #[serde(default)]
    pub size: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TagsResponse {
    pub models: Vec<TagModelEntry>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RunningModel {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RunningResponse {
    pub models: Vec<RunningModel>,
}

fn next_task_id() -> String {
    Uuid::new_v4().to_string()
}

async fn post(url: &str, payload: serde_json::Value) -> reqwest::Result<Response> {
    HTTP_CLIENT.post(url).json(&payload).send().await
}

async fn get(url: &str) -> reqwest::Result<Response> {
    HTTP_CLIENT.get(url).send().await
}

// ==================== Core API (non-Tauri) ====================

// Start a streaming chat. Returns a task_id and a channel receiving streamed tokens as strings.
pub async fn stream_chat_start(
    model: String,
    messages: Vec<ChatMessage>,
) -> Result<(String, UnboundedReceiver<String>), String> {
    let (tx, rx) = unbounded_channel::<String>();
    let task_id = next_task_id();
    let url = format!("{}/api/chat", OLLAMA_BASE_URL);

    // Spawn a task to stream and send chunks to channel
    let my_task_id = task_id.clone();
    let handle = tokio::spawn(async move {
        let body = json!({
            "model": model,
            "messages": messages,
            "stream": true
        });
        let result = post(&url, body).await;
        if let Ok(resp) = result {
            use futures_util::StreamExt;
            let mut stream = resp.bytes_stream();
            let mut buffer = String::new();
            while let Some(chunk_res) = stream.next().await {
                match chunk_res {
                    Ok(bytes) => {
                        // Accumulate and parse by line
                        buffer.push_str(&String::from_utf8_lossy(&bytes));
                        while let Some(idx) = buffer.find('\n') {
                            let line = buffer[..idx].to_string();
                            buffer.drain(..=idx);
                            if line.trim().is_empty() {
                                continue;
                            }
                            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&line) {
                                // Prefer chat message content
                                if let Some(msg) = val
                                    .get("message")
                                    .and_then(|m| m.get("content"))
                                    .and_then(|c| c.as_str())
                                {
                                    let _ = tx.send(msg.to_string());
                                } else if let Some(resp) =
                                    val.get("response").and_then(|c| c.as_str())
                                {
                                    let _ = tx.send(resp.to_string());
                                }
                                if val.get("done").and_then(|d| d.as_bool()) == Some(true) {
                                    // Flush remaining buffer tokens if any were contiguous
                                    buffer.clear();
                                    break;
                                }
                            }
                        }
                    }
                    Err(_) => break,
                }
            }
        }
        // Cleanup task registry
        RUNNING_TASKS.lock().unwrap().remove(&my_task_id);
        // Drop sender to close channel
    });

    RUNNING_TASKS
        .lock()
        .unwrap()
        .insert(task_id.clone(), handle);
    Ok((task_id, rx))
}

pub fn force_stop(task_id: &str) -> bool {
    if let Some(handle) = RUNNING_TASKS.lock().unwrap().remove(task_id) {
        handle.abort();
        true
    } else {
        false
    }
}

pub async fn get_models() -> Result<Vec<String>, String> {
    let url = format!("{}/api/tags", OLLAMA_BASE_URL);
    let resp = get(&url).await.map_err(|e| e.to_string())?;
    let tags: TagsResponse = resp.json().await.map_err(|e| e.to_string())?;
    Ok(tags.models.into_iter().map(|m| m.name).collect())
}

pub async fn get_active_models() -> Result<Vec<String>, String> {
    // Some versions expose /api/ps, others /api/running (community docs vary)
    // Try /api/ps first, then fallback to /api/running
    let try_urls = vec!["/api/ps", "/api/running"];
    for suffix in try_urls {
        let url = format!("{}{}", OLLAMA_BASE_URL, suffix);
        if let Ok(resp) = get(&url).await {
            if resp.status().is_success() {
                if let Ok(running) = resp.json::<RunningResponse>().await {
                    return Ok(running.models.into_iter().map(|m| m.name).collect());
                }
            }
        }
    }
    Ok(vec![])
}

pub async fn unload_model(model_name: &str) -> Result<(), String> {
    // Use generate with keep_alive 0 to unload
    let url = format!("{}/api/generate", OLLAMA_BASE_URL);
    let body = json!({
        "model": model_name,
        "prompt": "",
        "keep_alive": 0,
        "stream": false
    });
    let resp = post(&url, body).await.map_err(|e| e.to_string())?;
    if resp.status().is_success() {
        Ok(())
    } else {
        Err(format!("failed to unload model: {}", resp.status()))
    }
}

pub async fn generate_content(model: &str, prompt: &str) -> Result<String, String> {
    let url = format!("{}/api/generate", OLLAMA_BASE_URL);
    let body = json!({
        "model": model,
        "prompt": prompt,
        "stream": false
    });
    let resp = post(&url, body).await.map_err(|e| e.to_string())?;
    let r#gen: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    // Response may be { response, done } for generate
    if let Some(s) = r#gen.get("response").and_then(|v| v.as_str()) {
        Ok(s.to_string())
    } else if let Some(msg) = r#gen
        .get("message")
        .and_then(|m| m.get("content"))
        .and_then(|c| c.as_str())
    {
        Ok(msg.to_string())
    } else {
        Ok(r#gen.to_string())
    }
}

// ==================== Tauri Commands ====================

#[tauri::command]
pub async fn cmd_stream_chat_start(
    app: tauri::AppHandle,
    model: String,
    messages: Vec<ChatMessage>,
) -> Result<String, String> {
    // Return task_id; streaming will be emitted via events with that id
    let (task_id, mut rx) = stream_chat_start(model, messages).await?;
    let emit_task_id = task_id.clone();
    tauri::async_runtime::spawn(async move {
        while let Some(token) = rx.recv().await {
            let _ = app.emit(
                "ollama:stream",
                json!({ "taskId": emit_task_id, "token": token }),
            );
        }
        // Emit done
        let _ = app.emit("ollama:stream_done", json!({ "taskId": emit_task_id }));
    });
    Ok(task_id)
}

#[tauri::command]
pub fn cmd_force_stop(task_id: String) -> Result<bool, String> {
    Ok(force_stop(&task_id))
}

#[tauri::command]
pub async fn cmd_get_models() -> Result<Vec<String>, String> {
    get_models().await
}

#[tauri::command]
pub async fn cmd_get_active_models() -> Result<Vec<String>, String> {
    get_active_models().await
}

#[tauri::command]
pub async fn cmd_unload_model(model_name: String) -> Result<(), String> {
    unload_model(&model_name).await
}

#[tauri::command]
pub async fn cmd_generate_content(model: String, prompt: String) -> Result<String, String> {
    generate_content(&model, &prompt).await
}
