#!/usr/bin/env python3
"""
HideAway File Hashing Utility
Generates SHA-256 hash with salt for file integrity verification
"""

import hashlib
import os
import secrets
import sys
from typing import Tuple


def generate_salt() -> bytes:
    """Generate a random 32-byte salt"""
    return secrets.token_bytes(32)


def hash_file(file_path: str, salt: bytes = None) -> Tuple[bytes, bytes]:
    """
    Hash a file with SHA-256 and optional salt
    
    Args:
        file_path: Path to the file to hash
        salt: Optional salt bytes (32 bytes). If None, generates a new salt.
    
    Returns:
        Tuple of (file_hash, salt)
    """
    if salt is None:
        salt = generate_salt()
    
    if len(salt) != 32:
        raise ValueError("Salt must be exactly 32 bytes")
    
    sha256 = hashlib.sha256()
    
    # Read file in chunks to handle large files
    with open(file_path, 'rb') as f:
        while chunk := f.read(8192):
            sha256.update(chunk)
    
    # Add salt to hash
    sha256.update(salt)
    
    file_hash = sha256.digest()
    
    return file_hash, salt


def hash_string(text: str, salt: bytes = None) -> Tuple[bytes, bytes]:
    """
    Hash a string with SHA-256 and optional salt
    
    Args:
        text: String to hash
        salt: Optional salt bytes (32 bytes). If None, generates a new salt.
    
    Returns:
        Tuple of (hash, salt)
    """
    if salt is None:
        salt = generate_salt()
    
    if len(salt) != 32:
        raise ValueError("Salt must be exactly 32 bytes")
    
    sha256 = hashlib.sha256()
    sha256.update(text.encode('utf-8'))
    sha256.update(salt)
    
    hash_result = sha256.digest()
    
    return hash_result, salt


def verify_hash(file_path: str, expected_hash: bytes, salt: bytes) -> bool:
    """
    Verify a file's hash matches the expected hash
    
    Args:
        file_path: Path to the file
        expected_hash: Expected hash (32 bytes)
        salt: Salt used for hashing (32 bytes)
    
    Returns:
        True if hash matches, False otherwise
    """
    computed_hash, _ = hash_file(file_path, salt)
    return computed_hash == expected_hash


def main():
    """CLI interface for file hashing"""
    if len(sys.argv) < 2:
        print("Usage: python hash_file.py <file_path> [salt_hex]")
        print("\nExamples:")
        print("  python hash_file.py document.pdf")
        print("  python hash_file.py document.pdf abc123...")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    
    # Parse salt if provided
    salt = None
    if len(sys.argv) >= 3:
        try:
            salt = bytes.fromhex(sys.argv[2])
            if len(salt) != 32:
                raise ValueError("Salt must be 64 hex characters (32 bytes)")
        except ValueError as e:
            print(f"Error: Invalid salt format: {e}")
            sys.exit(1)
    
    # Hash file
    file_hash, salt_used = hash_file(file_path, salt)
    
    # Output results
    print(f"File: {file_path}")
    print(f"Hash: {file_hash.hex()}")
    print(f"Salt: {salt_used.hex()}")
    print(f"\nHash (hex): {file_hash.hex()}")
    print(f"Salt (hex): {salt_used.hex()}")


if __name__ == "__main__":
    main()
