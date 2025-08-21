use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::process::{Child, Command};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PythonServerStatus {
    pub is_running: bool,
    pub port: Option<u16>,
    pub pid: Option<u32>,
    pub url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MLModelRequest {
    pub model_name: String,
    pub input_data: serde_json::Value,
    pub parameters: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MLModelResponse {
    pub success: bool,
    pub result: Option<serde_json::Value>,
    pub error: Option<String>,
    pub processing_time: Option<f64>,
}

struct PythonServer {
    process: Option<Child>,
    port: u16,
    client: Client,
}

impl PythonServer {
    fn new() -> Self {
        Self {
            process: None,
            port: 8000,
            client: Client::new(),
        }
    }

    fn get_server_url(&self) -> String {
        format!("http://localhost:{}", self.port)
    }
}

static PYTHON_SERVER: once_cell::sync::Lazy<Arc<Mutex<PythonServer>>> =
    once_cell::sync::Lazy::new(|| Arc::new(Mutex::new(PythonServer::new())));

#[tauri::command]
pub async fn start_python_server(app: AppHandle) -> Result<PythonServerStatus, String> {
    {
        let server = PYTHON_SERVER.lock().unwrap();
        if server.process.is_some() {
            return Ok(PythonServerStatus {
                is_running: true,
                port: Some(server.port),
                pid: server.process.as_ref().map(|p| p.id()),
                url: Some(server.get_server_url()),
            });
        }
    }

    // Check if Python is available
    let python_check = Command::new("python").arg("--version").output();

    let python_cmd = if python_check.is_ok() {
        "python"
    } else {
        // Try python3
        let python3_check = Command::new("python3").arg("--version").output();
        if python3_check.is_ok() {
            "python3"
        } else {
            return Err("Python is not installed or not in PATH".to_string());
        }
    };

    // Get the path to the Python backend server
    let backend_path = std::env::current_dir()
        .map_err(|e| e.to_string())?
        .join("src-python");

    // Create backend directory if it doesn't exist
    std::fs::create_dir_all(&backend_path).map_err(|e| e.to_string())?;

    // Start the Python server
    let server_script = backend_path.join("server.py");
    let port = {
        let server = PYTHON_SERVER.lock().unwrap();
        server.port
    };

    let process = Command::new(python_cmd)
        .arg(server_script.to_str().unwrap())
        .arg("--port")
        .arg(port.to_string())
        .current_dir(&backend_path)
        .spawn()
        .map_err(|e| format!("Failed to start Python server: {}", e))?;

    {
        let mut server = PYTHON_SERVER.lock().unwrap();
        server.process = Some(process);
    }

    // Wait a bit for the server to start
    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;

    Ok(PythonServerStatus {
        is_running: true,
        port: Some(port),
        pid: {
            let server = PYTHON_SERVER.lock().unwrap();
            server.process.as_ref().map(|p| p.id())
        },
        url: Some(format!("http://localhost:{}", port)),
    })
}

#[tauri::command]
pub async fn stop_python_server() -> Result<PythonServerStatus, String> {
    let mut server = PYTHON_SERVER.lock().unwrap();

    if let Some(mut process) = server.process.take() {
        process
            .kill()
            .map_err(|e| format!("Failed to stop Python server: {}", e))?;
        process
            .wait()
            .map_err(|e| format!("Failed to wait for Python server: {}", e))?;
    }

    Ok(PythonServerStatus {
        is_running: false,
        port: None,
        pid: None,
        url: None,
    })
}

#[tauri::command]
pub async fn get_python_server_status() -> Result<PythonServerStatus, String> {
    let server = PYTHON_SERVER.lock().unwrap();

    let is_running = server.process.is_some();
    let pid = server.process.as_ref().map(|p| p.id());

    // Check if the server is actually responding
    let url = if is_running {
        Some(server.get_server_url())
    } else {
        None
    };

    Ok(PythonServerStatus {
        is_running,
        port: if is_running { Some(server.port) } else { None },
        pid,
        url,
    })
}

#[tauri::command]
pub async fn call_python_ml_model(request: MLModelRequest) -> Result<MLModelResponse, String> {
    let server_url = {
        let server = PYTHON_SERVER.lock().unwrap();
        if server.process.is_none() {
            return Err("Python server is not running. Start it first.".to_string());
        }
        server.get_server_url()
    };

    let url = format!("{}/predict", server_url);
    let start_time = std::time::Instant::now();
    let client = Client::new();

    let response = client
        .post(&url)
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Failed to send request to Python server: {}", e))?;

    let processing_time = start_time.elapsed().as_secs_f64();

    if response.status().is_success() {
        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        Ok(MLModelResponse {
            success: true,
            result: Some(result),
            error: None,
            processing_time: Some(processing_time),
        })
    } else {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());

        Ok(MLModelResponse {
            success: false,
            result: None,
            error: Some(error_text),
            processing_time: Some(processing_time),
        })
    }
}
