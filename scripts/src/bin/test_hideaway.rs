/// HideAway Testing Utilities
/// Tests file hashing and verification

use std::fs;
use std::io::Read;
use std::path::PathBuf;
use sha2::{Sha256, Digest};
use rand::RngCore;

const SALT_SIZE: usize = 32;

/// Generate a random 32-byte salt
fn generate_salt() -> [u8; SALT_SIZE] {
    let mut salt = [0u8; SALT_SIZE];
    rand::thread_rng().fill_bytes(&mut salt);
    salt
}

/// Hash a file with SHA-256 and optional salt
fn hash_file(file_path: &PathBuf, salt: Option<[u8; SALT_SIZE]>) -> std::io::Result<([u8; 32], [u8; SALT_SIZE])> {
    let salt = salt.unwrap_or_else(generate_salt);
    
    let mut file = std::fs::File::open(file_path)?;
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

/// Verify a file's hash matches the expected hash
fn verify_hash(file_path: &PathBuf, expected_hash: &[u8; 32], salt: &[u8; SALT_SIZE]) -> std::io::Result<bool> {
    let (computed_hash, _) = hash_file(file_path, Some(*salt))?;
    Ok(computed_hash == *expected_hash)
}

fn test_hash_consistency() -> Result<(), Box<dyn std::error::Error>> {
    println!("Testing hash consistency...");
    
    // Create a test file
    let test_content = b"Hello, HideAway! This is a test file.";
    let salt = generate_salt();
    
    let temp_dir = std::env::temp_dir();
    let temp_path = temp_dir.join(format!("test_hash_consistency_{}.txt", 
        std::process::id()));
    
    fs::write(&temp_path, test_content)?;
    
    // Hash twice with same salt
    let (hash1, _) = hash_file(&temp_path, Some(salt))?;
    let (hash2, _) = hash_file(&temp_path, Some(salt))?;
    
    assert_eq!(hash1, hash2, "Hashes should be identical with same salt");
    println!("✓ Hash consistency test passed");
    
    // Verify hash
    assert!(verify_hash(&temp_path, &hash1, &salt)?, "Hash verification should pass");
    println!("✓ Hash verification test passed");
    
    fs::remove_file(&temp_path).ok();
    Ok(())
}

fn test_salt_uniqueness() -> Result<(), Box<dyn std::error::Error>> {
    println!("\nTesting salt uniqueness...");
    
    let test_content = b"Test content";
    
    let temp_dir = std::env::temp_dir();
    let temp_path = temp_dir.join(format!("test_salt_uniqueness_{}.txt", 
        std::process::id()));
    
    fs::write(&temp_path, test_content)?;
    
    let salt1 = generate_salt();
    let salt2 = generate_salt();
    
    let (hash1, _) = hash_file(&temp_path, Some(salt1))?;
    let (hash2, _) = hash_file(&temp_path, Some(salt2))?;
    
    assert_ne!(hash1, hash2, "Different salts should produce different hashes");
    println!("✓ Salt uniqueness test passed");
    
    fs::remove_file(&temp_path).ok();
    Ok(())
}

fn test_hash_length() -> Result<(), Box<dyn std::error::Error>> {
    println!("\nTesting hash length...");
    
    let test_content = b"Test";
    
    let temp_dir = std::env::temp_dir();
    let temp_path = temp_dir.join(format!("test_hash_length_{}.txt", 
        std::process::id()));
    
    fs::write(&temp_path, test_content)?;
    
    let (hash_result, salt) = hash_file(&temp_path, None)?;
    
    assert_eq!(hash_result.len(), 32, "Hash should be 32 bytes, got {}", hash_result.len());
    assert_eq!(salt.len(), 32, "Salt should be 32 bytes, got {}", salt.len());
    println!("✓ Hash length test passed");
    
    fs::remove_file(&temp_path).ok();
    Ok(())
}

fn test_large_file() -> Result<(), Box<dyn std::error::Error>> {
    println!("\nTesting large file hashing...");
    
    // Create a 1MB test file
    let large_content = vec![b'x'; 1024 * 1024];
    
    let temp_dir = std::env::temp_dir();
    let temp_path = temp_dir.join(format!("test_large_file_{}.txt", 
        std::process::id()));
    
    fs::write(&temp_path, large_content)?;
    
    let (hash_result, salt) = hash_file(&temp_path, None)?;
    
    assert_eq!(hash_result.len(), 32, "Hash should be 32 bytes");
    assert!(verify_hash(&temp_path, &hash_result, &salt)?, "Verification should pass");
    println!("✓ Large file test passed");
    
    fs::remove_file(&temp_path).ok();
    Ok(())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("{}", "=".repeat(50));
    println!("HideAway File Hashing Tests");
    println!("{}", "=".repeat(50));
    
    test_hash_consistency()?;
    test_salt_uniqueness()?;
    test_hash_length()?;
    test_large_file()?;
    
    println!("\n{}", "=".repeat(50));
    println!("All tests passed! ✓");
    println!("{}", "=".repeat(50));
    
    Ok(())
}
