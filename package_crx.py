import sys
import struct
from pathlib import Path
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes,serialization
from cryptography.hazmat.primitives.asymmetric import padding

def x(z:str,k:str,o:str):
	with open(z,'rb') as f:e=f.read()
	with open(k,'rb') as f:v=serialization.load_pem_private_key(f.read(),password=None,backend=default_backend())
	u=v.public_key().public_bytes(encoding=serialization.Encoding.DER,format=serialization.PublicFormat.SubjectPublicKeyInfo)
	s=v.sign(e,padding.PKCS1v15(),hashes.SHA256())
	with open(o,'wb') as f:
		f.write(b'Cr24')
		f.write(struct.pack('<I',3))
		h=4+4+len(u)+4+len(s)
		f.write(struct.pack('<I',h))
		f.write(struct.pack('<I',len(u)))
		f.write(u)
		f.write(struct.pack('<I',len(s)))
		f.write(s)
		f.write(e)

if __name__ == '__main__':
	x(sys.argv[1],sys.argv[2],sys.argv[3])