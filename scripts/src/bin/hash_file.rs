/// HideAway File Hashing Utility
/// Generates SHA-256 hash with salt for file integrity verification

use sha2::{Sha256, Digest};
use std::fs::File;
use std::io::{self, Read};
use std::path::PathBuf;
use clap::Parser;
use rand::RngCore;

const SALT_SIZE: usize = 32;

/// Generate a random 32-byte salt
fn generate_salt() -> [u8; SALT_SIZE] {
    let mut salt = [0u8; SALT_SIZE];
    rand::thread_rng().fill_bytes(&mut salt);
    salt
}

/// Hash a file with SHA-256 and optional salt
/// 
/// # Arguments
/// * `file_path` - Path to the file to hash
/// * `salt` - Optional salt bytes (32 bytes). If None, generates a new salt.
/// 
/// # Returns
/// Tuple of (file_hash, salt)
fn hash_file(file_path: &PathBuf, salt: Option<[u8; SALT_SIZE]>) -> io::Result<([u8; 32], [u8; SALT_SIZE])> {
    let salt = salt.unwrap_or_else(generate_salt);
    
    let mut file = File::open(file_path)?;
    let mut hasher = Sha256::new();
    
    // Read file in chunks to handle large files
    let mut buffer = [0u8; 8192];
    loop {
        let bytes_read = file.read(&mut buffer)?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
    }
    
    // Add salt to hash
    hasher.update(&salt);
    
    let file_hash = hasher.finalize();
    let mut hash_array = [0u8; 32];
    hash_array.copy_from_slice(&file_hash);
    
    Ok((hash_array, salt))
}

/// Hash a string with SHA-256 and optional salt
/// 
/// # Arguments
/// * `text` - String to hash
/// * `salt` - Optional salt bytes (32 bytes). If None, generates a new salt.
/// 
/// # Returns
/// Tuple of (hash, salt)
pub fn hash_string(text: &str, salt: Option<[u8; SALT_SIZE]>) -> ([u8; 32], [u8; SALT_SIZE]) {
    let salt = salt.unwrap_or_else(generate_salt);
    
    let mut hasher = Sha256::new();
    hasher.update(text.as_bytes());
    hasher.update(&salt);
    
    let hash_result = hasher.finalize();
    let mut hash_array = [0u8; 32];
    hash_array.copy_from_slice(&hash_result);
    
    (hash_array, salt)
}

/// Verify a file's hash matches the expected hash
/// 
/// # Arguments
/// * `file_path` - Path to the file
/// * `expected_hash` - Expected hash (32 bytes)
/// * `salt` - Salt used for hashing (32 bytes)
/// 
/// # Returns
/// True if hash matches, false otherwise
pub fn verify_hash(file_path: &PathBuf, expected_hash: &[u8; 32], salt: &[u8; SALT_SIZE]) -> io::Result<bool> {
    let (computed_hash, _) = hash_file(file_path, Some(*salt))?;
    Ok(computed_hash == *expected_hash)
}

#[derive(Parser)]
#[command(name = "hash_file")]
#[command(about = "HideAway File Hashing Utility", long_about = None)]
struct Cli {
    /// Path to the file to hash
    file_path: PathBuf,
    
    /// Salt in hex format (64 hex characters = 32 bytes). If not provided, generates a new salt.
    #[arg(short, long)]
    salt: Option<String>,
}

fn main() -> io::Result<()> {
    let cli = Cli::parse();
    
    if !cli.file_path.exists() {
        eprintln!("Error: File not found: {}", cli.file_path.display());
        std::process::exit(1);
    }
    
    // Parse salt if provided
    let salt = if let Some(salt_hex) = cli.salt {
        match hex::decode(&salt_hex) {
            Ok(salt_bytes) => {
                if salt_bytes.len() != SALT_SIZE {
                    eprintln!("Error: Salt must be 64 hex characters (32 bytes)");
                    std::process::exit(1);
                }
                let mut salt_array = [0u8; SALT_SIZE];
                salt_array.copy_from_slice(&salt_bytes);
                Some(salt_array)
            }
            Err(e) => {
                eprintln!("Error: Invalid salt format: {}", e);
                std::process::exit(1);
            }
        }
    } else {
        None
    };
    
    // Hash file
    let (file_hash, salt_used) = hash_file(&cli.file_path, salt)?;
    
    // Output results
    println!("File: {}", cli.file_path.display());
    println!("Hash: {}", hex::encode(file_hash));
    println!("Salt: {}", hex::encode(salt_used));
    println!();
    println!("Hash (hex): {}", hex::encode(file_hash));
    println!("Salt (hex): {}", hex::encode(salt_used));
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::Path;
    
    #[test]
    fn test_hash_consistency() {
        let test_content = b"Hello, HideAway! This is a test file.";
        let salt = generate_salt();
        
        let temp_dir = std::env::temp_dir();
        let temp_path = temp_dir.join("test_hash_consistency.txt");
        
        fs::write(&temp_path, test_content).unwrap();
        
        let (hash1, _) = hash_file(&temp_path, Some(salt)).unwrap();
        let (hash2, _) = hash_file(&temp_path, Some(salt)).unwrap();
        
        assert_eq!(hash1, hash2, "Hashes should be identical with same salt");
        
        fs::remove_file(&temp_path).ok();
    }
    
    #[test]
    fn test_salt_uniqueness() {
        let test_content = b"Test content";
        
        let temp_dir = std::env::temp_dir();
        let temp_path = temp_dir.join("test_salt_uniqueness.txt");
        
        fs::write(&temp_path, test_content).unwrap();
        
        let salt1 = generate_salt();
        let salt2 = generate_salt();
        
        let (hash1, _) = hash_file(&temp_path, Some(salt1)).unwrap();
        let (hash2, _) = hash_file(&temp_path, Some(salt2)).unwrap();
        
        assert_ne!(hash1, hash2, "Different salts should produce different hashes");
        
        fs::remove_file(&temp_path).ok();
    }
    
    #[test]
    fn test_hash_length() {
        let test_content = b"Test";
        
        let temp_dir = std::env::temp_dir();
        let temp_path = temp_dir.join("test_hash_length.txt");
        
        fs::write(&temp_path, test_content).unwrap();
        
        let (hash_result, salt) = hash_file(&temp_path, None).unwrap();
        
        assert_eq!(hash_result.len(), 32, "Hash should be 32 bytes");
        assert_eq!(salt.len(), 32, "Salt should be 32 bytes");
        
        fs::remove_file(&temp_path).ok();
    }
}
