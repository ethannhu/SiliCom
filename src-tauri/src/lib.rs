use regex::Regex;
use serde::Serialize;
use std::fs::File;
use std::io::Read;
use std::io::{BufWriter, Write};
use std::path::Path;
use std::time::Duration;
use tauri::{Manager, State};
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
// Tauri 命令：打开串口并启动读取线程
#[tauri::command]
async fn open_serial_port(
    session_state: State<'_, SessionState>,
    port_name: String,
    baud_rate: u32,
    reader: tauri::ipc::Channel<&[u8]>,
) -> Result<(), String> {
    // 尝试打开串口
    let port = serialport::new(&port_name, baud_rate)
        .timeout(Duration::from_millis(50))
        .open();
    match port {
        Ok(mut port) => {
            session_state
                .running
                .store(true, std::sync::atomic::Ordering::SeqCst);
            // 存储缓冲区
            let mut temp_read_buffer = vec![0u8; 10 * 1024];
            println!("Session running!");
            loop {
                let running = session_state
                    .running
                    .load(std::sync::atomic::Ordering::SeqCst);
                if !running {
                    break;
                }
                {
                    let mut write_buffer = session_state.write_buffer.lock().unwrap();
                    if !write_buffer.is_empty() {
                        match port.write(write_buffer.as_slice()) {
                            Ok(n) => {
                                println!("Writed {} bytes, total {} bytes", n, write_buffer.len());
                            }
                            Err(e) => {
                                eprintln!("{}", e.to_string());
                            }
                        }
                        write_buffer.clear();
                    }
                }
                match port.read(temp_read_buffer.as_mut_slice()) {
                    Ok(n) => {
                        // 通过 Channel 发送 &[u8]
                        if let Err(e) = reader.send(&temp_read_buffer[..n]) {
                            eprintln!("Failed to send data through channel: {}", e);
                            break;
                        }
                        let mut read_buffer = session_state.read_buffer.write().unwrap();
                        read_buffer.extend_from_slice(&temp_read_buffer[..n]);
                    }
                    Err(_e) => {
                        //eprintln!("{}", e.to_string());
                        //break;
                    }
                }
            }
            Ok(())
        }
        Err(e) => Err(e.to_string()),
    }
}

#[derive(Default)]
struct SessionState {
    running: std::sync::atomic::AtomicBool,
    write_buffer: std::sync::Mutex<Vec<u8>>,
    read_buffer: std::sync::RwLock<Vec<u8>>,
}

// Tauri 命令：关闭串口并终止线程
#[tauri::command]
fn close_serial_port(state: State<SessionState>) -> Result<(), ()> {
    let running = state.running.load(std::sync::atomic::Ordering::SeqCst);
    if !running {
        Err(())
    } else {
        state
            .running
            .store(false, std::sync::atomic::Ordering::SeqCst);

        /*
        let mut write_buffer = state.write_buffer.lock().unwrap();
        write_buffer.clear();
        */
        Ok(())
    }
}

#[tauri::command]
async fn write_port(state: State<'_, SessionState>, input_string: String) -> Result<(), ()> {
    let running = state.running.load(std::sync::atomic::Ordering::SeqCst);
    if !running {
        Err(())
    } else {
        let mut buffer = state.write_buffer.lock().unwrap();
        let bytes = input_string.as_bytes();
        buffer.extend_from_slice(bytes);
        println!("buffer extends");
        Ok(())
    }
}

#[tauri::command]
async fn get_read_buffer_usage(session_state: State<'_, SessionState>) -> Result<u8, ()> {
    let read_buffer = session_state.read_buffer.read().unwrap();
    match read_buffer.len().try_into() {
        Ok(usage) => Ok(usage),
        Err(err) => Err(()),
    }
}

#[derive(Default, Serialize)]
struct RegexMatchResult {
    start: usize,
    end: usize,
    text: String,
}

#[tauri::command]
async fn save_buffer(
    state: State<'_, SessionState>,
    path: String,
    in_bytes: bool,
    should_dump: bool,
) -> Result<u8, ()> {
    let path = Path::new(&path);
    let file = File::create(path).unwrap();
    let mut buf_writer = BufWriter::new(file); // 缓冲写入器
    let mut buffer = state.read_buffer.write().unwrap();
    // 写入数据（缓冲会自动刷新，也可手动调用 buf_writer.flush()）
    match buf_writer.write_all(buffer.as_slice()) {
        Ok(())=>{
            let _ = buf_writer.flush();
            if should_dump {
                buffer.clear();
            }
            Ok(1)
        }
        Err(err)=>{
            let _ = buf_writer.flush();
            Err(())
        }
    }
}

#[tauri::command]
fn clear_buffer(state: State<SessionState>) {
    let mut buffer = state.read_buffer.write().unwrap();
    buffer.clear();
}

#[tauri::command]
async fn match_regex(
    state: State<'_, SessionState>,
    regex_str: String,
) -> Result<Vec<RegexMatchResult>, ()> {
    match Regex::new(&regex_str) {
        Ok(re) => {
            let bytes = state.read_buffer.read().unwrap();
            let text = String::from_utf8_lossy(&bytes);
            if re.is_match(&text) {
                let all_matches: Vec<RegexMatchResult> = re
                    .find_iter(&text)
                    .map(|mat| RegexMatchResult {
                        start: mat.start(),
                        end: mat.end(),
                        text: mat.as_str().to_string(),
                    })
                    .collect();
                Ok(all_matches)
            } else {
                Ok(vec![RegexMatchResult::default()])
            }
        }
        Err(e) => Err(()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            open_serial_port,
            close_serial_port,
            write_port,
            get_read_buffer_usage,
            match_regex,
            save_buffer,
            clear_buffer,
        ])
        .setup(|app| {
            app.manage(SessionState::default());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
