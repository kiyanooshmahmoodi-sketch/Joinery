#!/usr/bin/env python3
"""Bump the CabLine version everywhere it must change: python3 tools/bump.py"""
import re,json,pathlib
root=pathlib.Path(__file__).resolve().parent.parent
idx=root/'index.html';s=idx.read_text(encoding='utf-8')
cur=int(re.search(r'v(\d+) · Software Design by Kiya',s).group(1));new=cur+1
s=s.replace(f'v{cur} · Software Design by Kiya',f'v{new} · Software Design by Kiya')
idx.write_text(s,encoding='utf-8');(root/'version.json').write_text(json.dumps({'version':new})+'\n')
print(f'v{cur} -> v{new}')
