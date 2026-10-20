# 소재 목록 만들기 — 경로 설정
import os
H = os.path.dirname(os.path.abspath(__file__))
RAW = os.environ.get('ITGYEOL_RAW', os.path.join(H, 'raw'))      # 브라우저 수집 스크립트가 내려받은 원본 JSON을 둔 곳
WORK = os.environ.get('ITGYEOL_WORK', os.path.join(H, 'work'))   # 중간 결과(깃에 올리지 않음)
APP = os.path.abspath(os.path.join(H, '..', '..'))              # 앱 저장소 맨 위
os.makedirs(WORK, exist_ok=True)
