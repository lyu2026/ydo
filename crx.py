import struct
import sys
from pathlib import Path
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend

def build_crx(zip_path: str, key_path: str, output_path: str):
    # 读取 zip
    with open(zip_path, 'rb') as f:
        zip_data = f.read()

    # 读取私钥
    with open(key_path, 'rb') as f:
        private_key = serialization.load_pem_private_key(
            f.read(),
            password=None,
            backend=default_backend()
        )

    # 获取公钥 DER
    public_key = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    # SHA256 签名
    signature = private_key.sign(
        zip_data,
        padding.PKCS1v15(),
        hashes.SHA256()
    )

    # 写入 CRX3 格式
    with open(output_path, 'wb') as f:
        # Magic: Cr24
        f.write(b'Cr24')
        # Version: 3
        f.write(struct.pack('<I', 3))
        # Header length
        header_len = 4 + 4 + len(public_key) + 4 + len(signature)
        f.write(struct.pack('<I', header_len))
        # Public key length + data
        f.write(struct.pack('<I', len(public_key)))
        f.write(public_key)
        # Signature length + data
        f.write(struct.pack('<I', len(signature)))
        f.write(signature)
        # Zip content
        f.write(zip_data)

    print(f"✓ Built: {output_path} ({len(zip_data)} bytes)")

if __name__ == '__main__':
    build_crx(sys.argv[1], sys.argv[2], sys.argv[3])