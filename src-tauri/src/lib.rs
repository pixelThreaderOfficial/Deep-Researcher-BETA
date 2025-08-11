// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

mod ollama_api;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            ollama_api::cmd_stream_chat_start,
            ollama_api::cmd_force_stop,
            ollama_api::cmd_get_models,
            ollama_api::cmd_get_active_models,
            ollama_api::cmd_unload_model,
            ollama_api::cmd_generate_content,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
