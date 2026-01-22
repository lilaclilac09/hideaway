#!/usr/bin/env python3
"""
HideAway Testing Utilities
Tests file hashing and verification
"""

import hashlib
import secrets
import tempfile
import os
from hash_file import hash_file, verify_hash, generate_salt


def test_hash_consistency():
    """Test that hashing the same file with same salt produces same hash"""
    print("Testing hash consistency...")
    
    # Create a test file
    test_content = b"Hello, HideAway! This is a test file."
    salt = generate_salt()
    
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(test_content)
        temp_path = f.name
    
    try:
        # Hash twice with same salt
        hash1, _ = hash_file(temp_path, salt)
        hash2, _ = hash_file(temp_path, salt)
        
        assert hash1 == hash2, "Hashes should be identical with same salt"
        print("✓ Hash consistency test passed")
        
        # Verify hash
        assert verify_hash(temp_path, hash1, salt), "Hash verification should pass"
        print("✓ Hash verification test passed")
        
    finally:
        os.unlink(temp_path)


def test_salt_uniqueness():
    """Test that different salts produce different hashes"""
    print("\nTesting salt uniqueness...")
    
    test_content = b"Test content"
    
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(test_content)
        temp_path = f.name
    
    try:
        salt1 = generate_salt()
        salt2 = generate_salt()
        
        hash1, _ = hash_file(temp_path, salt1)
        hash2, _ = hash_file(temp_path, salt2)
        
        assert hash1 != hash2, "Different salts should produce different hashes"
        print("✓ Salt uniqueness test passed")
        
    finally:
        os.unlink(temp_path)


def test_hash_length():
    """Test that hash is always 32 bytes (SHA-256)"""
    print("\nTesting hash length...")
    
    test_content = b"Test"
    
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(test_content)
        temp_path = f.name
    
    try:
        hash_result, salt = hash_file(temp_path)
        
        assert len(hash_result) == 32, f"Hash should be 32 bytes, got {len(hash_result)}"
        assert len(salt) == 32, f"Salt should be 32 bytes, got {len(salt)}"
        print("✓ Hash length test passed")
        
    finally:
        os.unlink(temp_path)


def test_large_file():
    """Test hashing a larger file"""
    print("\nTesting large file hashing...")
    
    # Create a 1MB test file
    large_content = b"x" * (1024 * 1024)
    
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(large_content)
        temp_path = f.name
    
    try:
        hash_result, salt = hash_file(temp_path)
        
        assert len(hash_result) == 32, "Hash should be 32 bytes"
        assert verify_hash(temp_path, hash_result, salt), "Verification should pass"
        print("✓ Large file test passed")
        
    finally:
        os.unlink(temp_path)


def main():
    """Run all tests"""
    print("=" * 50)
    print("HideAway File Hashing Tests")
    print("=" * 50)
    
    try:
        test_hash_consistency()
        test_salt_uniqueness()
        test_hash_length()
        test_large_file()
        
        print("\n" + "=" * 50)
        print("All tests passed! ✓")
        print("=" * 50)
        
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        return 1
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
