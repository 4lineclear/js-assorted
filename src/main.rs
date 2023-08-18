#![forbid(unsafe_code)]
#![deny(
    clippy::all,
    clippy::pedantic,
    // clippy::cargo,
    clippy::nursery,
    // missing_docs,
    // rustdoc::all,
    future_incompatible
)]
// #![warn(missing_debug_implementations)]
#![allow(clippy::enum_glob_use)]
use axum::{response::IntoResponse, routing::get, Json};
use rand::seq::IteratorRandom;
use std::io::BufRead;
use std::{
    fs::{read_dir, File},
    io::BufReader,
};

use tokio::task;
use tower_http::services::{ServeDir, ServeFile};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        // .with_max_level(tracing::Level::DEBUG)
        .init();
    println!("\x1b[32mStarting server on port 8080\x1b[0m");
    let app = axum::Router::new()
        .route("/projects", get(projects))
        .route("/rand-five-letter", get(rand_five_letter))
        .nest_service("/", ServeFile::new("assets/index.html"))
        .nest_service("/favicon", ServeFile::new("assets/favicon.png"))
        .nest_service("/main.css", ServeFile::new("assets/styles.css"))
        .nest_service("/project", ServeDir::new("assets/projects/html"))
        .nest_service("/project/css", ServeDir::new("assets/projects/css"))
        .nest_service("/project/js", ServeDir::new("assets/projects/js"))
        .nest_service("/project/data", ServeDir::new("assets/projects/data"));

    axum::Server::bind(&"0.0.0.0:8080".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn projects() -> impl IntoResponse {
    const PATH: &str = "assets/projects/html";
    match task::spawn_blocking(move || {
        let dir = read_dir(PATH);

        match dir {
            Ok(dir) => Json({
                let mut projects = Vec::new();
                for entry in dir {
                    entry.map_or_else(
                        |e| eprintln!("Invalid file: {e:?}"),
                        |entry| {
                            entry.file_name().to_str().map_or_else(
                                || eprintln!("Invalid file: {entry:?}"),
                                |path| projects.push(path.to_string()),
                            );
                        },
                    );
                }
                projects.sort();
                projects
            }),
            Err(e) => {
                eprintln!("Error: {e}");
                Json(vec![])
            }
        }
    })
    .await
    {
        Ok(json) => json,
        Err(e) => {
            eprintln!("Error: {e}");
            Json(vec![])
        }
    }
}
#[allow(clippy::unused_async)]
// words from https://github.com/charlesreid1/five-letter-words/blob/master/sgb-words.txt
async fn rand_five_letter() -> impl IntoResponse {
    const FILENAME: &str = "./assets/projects/data/five-letter-words.txt";
    let f =
        File::open(FILENAME).unwrap_or_else(|e| panic!("(;_;) file not found: {FILENAME}: {e}"));
    let f = BufReader::new(f);

    let lines = f.lines().map(|l| l.expect("Couldn't read line"));

    lines
        .choose(&mut rand::thread_rng())
        .expect("File had no lines")
}
