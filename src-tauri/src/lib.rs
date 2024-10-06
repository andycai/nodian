// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use arboard::Clipboard;
use log::info;
use rusqlite::{params, Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;
// use chrono::NaiveDate;

#[tauri::command]
fn get_root_folder() -> String {
    let home_dir = dirs::home_dir().unwrap_or_else(|| PathBuf::from("/"));
    let root_dir = home_dir.join("nodian");
    if !root_dir.exists() {
        fs::create_dir_all(&root_dir).unwrap();
    }
    root_dir.to_str().unwrap().to_string()
}

#[tauri::command]
fn get_file_tree(path: &str) -> Result<FileNode, String> {
    info!("Getting file tree for path: {}", path);
    let path = PathBuf::from(path);
    if !path.exists() {
        return Err(format!("Path does not exist: {}", path.display()));
    }
    let tree = build_file_tree(&path, true);
    info!("File tree: {:?}", tree);
    Ok(tree)
}

fn build_file_tree(path: &PathBuf, is_root: bool) -> FileNode {
    let name = path
        .file_name()
        .unwrap_or_default()
        .to_str()
        .unwrap_or_default()
        .to_string();
    let is_dir = path.is_dir() || is_root;
    let children = if is_dir {
        fs::read_dir(path)
            .map(|entries| {
                entries
                    .filter_map(Result::ok)
                    .map(|entry| build_file_tree(&entry.path(), false))
                    .collect()
            })
            .unwrap_or_else(|e| {
                info!("Error reading directory {}: {}", path.display(), e);
                Vec::new()
            })
    } else {
        Vec::new()
    };

    FileNode {
        name,
        path: path.to_str().unwrap_or_default().to_string(),
        is_dir,
        children,
    }
}

#[tauri::command]
fn read_file(path: &str) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_file(path: &str, content: &str) -> Result<(), String> {
    fs::write(path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_folder(path: &str) -> Result<(), String> {
    fs::create_dir_all(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_file(path: &str) -> Result<(), String> {
    fs::File::create(path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn rename_item(old_path: &str, new_path: &str) -> Result<(), String> {
    fs::rename(old_path, new_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_item(path: &str) -> Result<(), String> {
    let path = PathBuf::from(path);
    if path.is_dir() {
        fs::remove_dir_all(path).map_err(|e| e.to_string())
    } else {
        fs::remove_file(path).map_err(|e| e.to_string())
    }
}

struct ClipboardState(Mutex<Clipboard>);

#[tauri::command]
fn get_clipboard_content(state: tauri::State<ClipboardState>) -> Result<String, String> {
    let mut clipboard = state.0.lock().unwrap();
    clipboard.get_text().map_err(|e| e.to_string())
    // let content = clipboard.get_text().map_err(|e| e.to_string())?;
    // clipboard.set_text("").map_err(|e| e.to_string())?;
    // Ok(content)
}

#[tauri::command]
fn set_clipboard_content(
    content: String,
    state: tauri::State<ClipboardState>,
) -> Result<(), String> {
    let mut clipboard = state.0.lock().unwrap();
    clipboard.set_text(content).map_err(|e| e.to_string())
}

// 日程

#[derive(Debug, Serialize, Deserialize)]
struct Event {
    id: i64,
    title: String,
    description: String,
    date: String,
}

#[tauri::command]
fn get_events(date: String) -> Result<Vec<Event>, String> {
    let conn = Connection::open("events.db").map_err(|e| e.to_string())?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, title, description, date FROM events WHERE date = ?")
        .map_err(|e| e.to_string())?;
    let events = stmt
        .query_map(params![date], |row| {
            Ok(Event {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                date: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(events)
}

#[tauri::command]
fn add_event(title: String, description: String, date: String) -> Result<(), String> {
    let conn = Connection::open("events.db").map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO events (title, description, date) VALUES (?, ?, ?)",
        params![title, description, date],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn delete_event(id: i64) -> Result<(), String> {
    let conn = Connection::open("events.db").map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM events WHERE id = ?", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(serde::Serialize, Debug)]
struct FileNode {
    name: String,
    path: String,
    is_dir: bool,
    children: Vec<FileNode>,
}

// 新增结构体用于表示剪贴板记录
#[derive(Debug, Serialize, Deserialize)]
struct ClipboardRecord {
    id: i64,
    content: String,
    timestamp: i64,
}

// 初始化数据库连接和表
fn init_clipboard_db() -> SqliteResult<Connection> {
    let conn = Connection::open("clipboard.db")?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS clipboard_history (
            id INTEGER PRIMARY KEY,
            content TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        )",
        [],
    )?;
    Ok(conn)
}

#[tauri::command]
fn add_clipboard_record(
    content: String,
    state: tauri::State<ClipboardState>,
) -> Result<(), String> {
    let mut clipboard = state.0.lock().unwrap();
    clipboard.set_text(&content).map_err(|e| e.to_string())?;

    let conn = init_clipboard_db().map_err(|e| e.to_string())?;
    let timestamp = chrono::Utc::now().timestamp();
    conn.execute(
        "INSERT INTO clipboard_history (content, timestamp) VALUES (?, ?)",
        params![content, timestamp],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_clipboard_history() -> Result<Vec<ClipboardRecord>, String> {
    let conn = init_clipboard_db().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, content, timestamp FROM clipboard_history ORDER BY timestamp DESC LIMIT 10",
        )
        .map_err(|e| e.to_string())?;
    let records = stmt
        .query_map([], |row| {
            Ok(ClipboardRecord {
                id: row.get(0)?,
                content: row.get(1)?,
                timestamp: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<SqliteResult<Vec<_>>>()
        .map_err(|e| e.to_string())?;
    Ok(records)
}

#[tauri::command]
fn delete_latest_clipboard_record() -> Result<(), String> {
    let conn = init_clipboard_db().map_err(|e| e.to_string())?;
    conn.execute(
        "DELETE FROM clipboard_history WHERE id = (SELECT id FROM clipboard_history ORDER BY timestamp DESC LIMIT 1)",
        [],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                // let window = app.get_window("main").unwrap();
                // window.open_devtools();
            }
            Ok(())
        })
        .manage(ClipboardState(Mutex::new(Clipboard::new().unwrap())))
        .invoke_handler(tauri::generate_handler![
            get_root_folder,
            get_file_tree,
            read_file,
            write_file,
            create_folder,
            create_file,
            rename_item,
            delete_item,
            get_clipboard_content,
            set_clipboard_content,
            get_events,
            add_event,
            delete_event,
            add_clipboard_record,
            get_clipboard_history,
            delete_latest_clipboard_record
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
