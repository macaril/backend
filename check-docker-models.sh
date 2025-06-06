#!/bin/bash

# Script untuk memeriksa file model dalam container Docker

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Dapatkan ID container yang berjalan
CONTAINER_ID=$(docker ps -qf "ancestor=artisign-backend" || docker ps -qf "name=artisign")

if [ -z "$CONTAINER_ID" ]; then
  echo -e "${RED}Error: Tidak dapat menemukan container backend yang berjalan.${NC}"
  echo "Pastikan container Docker sudah berjalan."
  echo "Daftar container yang sedang berjalan:"
  docker ps
  exit 1
fi

echo -e "${GREEN}Menemukan container dengan ID: ${CONTAINER_ID}${NC}"

# Periksa direktori models di container
echo -e "\n${YELLOW}Memeriksa direktori models di container...${NC}"
docker exec $CONTAINER_ID ls -la /usr/src/app/models

# Periksa file pemetaan kelas
echo -e "\n${YELLOW}Memeriksa file pemetaan kelas...${NC}"
docker exec $CONTAINER_ID ls -la /usr/src/app/models/image_class_mapping.json 2>/dev/null
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ File image_class_mapping.json ditemukan${NC}"
else
  echo -e "${RED}✗ File image_class_mapping.json TIDAK ditemukan${NC}"
fi

docker exec $CONTAINER_ID ls -la /usr/src/app/models/video_class_mapping.json 2>/dev/null
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ File video_class_mapping.json ditemukan${NC}"
else
  echo -e "${RED}✗ File video_class_mapping.json TIDAK ditemukan${NC}"
fi

# Periksa direktori model landmark
echo -e "\n${YELLOW}Memeriksa direktori model landmark...${NC}"
MODEL_DIR="/usr/src/app/models/tfjs_bisindo_landmark_model"
docker exec $CONTAINER_ID ls -la $MODEL_DIR 2>/dev/null
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Direktori tfjs_bisindo_landmark_model ditemukan${NC}"
  
  # Periksa file model.json
  docker exec $CONTAINER_ID ls -la $MODEL_DIR/model.json 2>/dev/null
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ File model.json ditemukan di direktori landmark model${NC}"
    
    # Periksa ukuran file model.json
    SIZE=$(docker exec $CONTAINER_ID stat -c%s "$MODEL_DIR/model.json" 2>/dev/null)
    echo -e "  Ukuran file: $SIZE bytes"
    
    # Periksa file weight (.bin)
    BIN_COUNT=$(docker exec $CONTAINER_ID ls -1 $MODEL_DIR/*.bin 2>/dev/null | wc -l)
    if [ $BIN_COUNT -gt 0 ]; then
      echo -e "${GREEN}✓ Ditemukan $BIN_COUNT file weight (.bin) di direktori landmark model${NC}"
    else
      echo -e "${RED}✗ TIDAK ditemukan file weight (.bin) di direktori landmark model${NC}"
    fi
  else
    echo -e "${RED}✗ File model.json TIDAK ditemukan di direktori landmark model${NC}"
  fi
else
  echo -e "${RED}✗ Direktori tfjs_bisindo_landmark_model TIDAK ditemukan${NC}"
fi

# Periksa direktori model video LSTM
echo -e "\n${YELLOW}Memeriksa direktori model video LSTM...${NC}"
MODEL_DIR="/usr/src/app/models/tfjs_bisindo_video_lstm_model"
docker exec $CONTAINER_ID ls -la $MODEL_DIR 2>/dev/null
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Direktori tfjs_bisindo_video_lstm_model ditemukan${NC}"
  
  # Periksa file model.json
  docker exec $CONTAINER_ID ls -la $MODEL_DIR/model.json 2>/dev/null
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ File model.json ditemukan di direktori video LSTM model${NC}"
    
    # Periksa ukuran file model.json
    SIZE=$(docker exec $CONTAINER_ID stat -c%s "$MODEL_DIR/model.json" 2>/dev/null)
    echo -e "  Ukuran file: $SIZE bytes"
    
    # Periksa file weight (.bin)
    BIN_COUNT=$(docker exec $CONTAINER_ID ls -1 $MODEL_DIR/*.bin 2>/dev/null | wc -l)
    if [ $BIN_COUNT -gt 0 ]; then
      echo -e "${GREEN}✓ Ditemukan $BIN_COUNT file weight (.bin) di direktori video LSTM model${NC}"
    else
      echo -e "${RED}✗ TIDAK ditemukan file weight (.bin) di direktori video LSTM model${NC}"
    fi
  else
    echo -e "${RED}✗ File model.json TIDAK ditemukan di direktori video LSTM model${NC}"
  fi
else
  echo -e "${RED}✗ Direktori tfjs_bisindo_video_lstm_model TIDAK ditemukan${NC}"
fi

# Periksa direktori model video transformer
echo -e "\n${YELLOW}Memeriksa direktori model video transformer...${NC}"
MODEL_DIR="/usr/src/app/models/tfjs_bisindo_video_transformer_model"
docker exec $CONTAINER_ID ls -la $MODEL_DIR 2>/dev/null
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Direktori tfjs_bisindo_video_transformer_model ditemukan${NC}"
  
  # Periksa file model.json
  docker exec $CONTAINER_ID ls -la $MODEL_DIR/model.json 2>/dev/null
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ File model.json ditemukan di direktori video transformer model${NC}"
    
    # Periksa ukuran file model.json
    SIZE=$(docker exec $CONTAINER_ID stat -c%s "$MODEL_DIR/model.json" 2>/dev/null)
    echo -e "  Ukuran file: $SIZE bytes"
    
    # Periksa file weight (.bin)
    BIN_COUNT=$(docker exec $CONTAINER_ID ls -1 $MODEL_DIR/*.bin 2>/dev/null | wc -l)
    if [ $BIN_COUNT -gt 0 ]; then
      echo -e "${GREEN}✓ Ditemukan $BIN_COUNT file weight (.bin) di direktori video transformer model${NC}"
    else
      echo -e "${RED}✗ TIDAK ditemukan file weight (.bin) di direktori video transformer model${NC}"
    fi
  else
    echo -e "${RED}✗ File model.json TIDAK ditemukan di direktori video transformer model${NC}"
  fi
else
  echo -e "${RED}✗ Direktori tfjs_bisindo_video_transformer_model TIDAK ditemukan${NC}"
fi

# Periksa izin file
echo -e "\n${YELLOW}Memeriksa izin file di direktori model...${NC}"
docker exec $CONTAINER_ID ls -la /usr/src/app/models

# Periksa Docker Volumes
echo -e "\n${YELLOW}Memeriksa Docker Volumes...${NC}"
docker volume ls

# Periksa Logs Container
echo -e "\n${YELLOW}Memeriksa logs container terkait loading model...${NC}"
docker logs $CONTAINER_ID | grep -i "model loaded" | tail -10
docker logs $CONTAINER_ID | grep -i "error loading" | tail -10

# Periksa API health
echo -e "\n${YELLOW}Memeriksa API health...${NC}"
curl -s http://localhost:3000/api/health | jq '.' || echo "Gagal mengakses endpoint /api/health atau jq tidak terinstall"

echo -e "\n${GREEN}Pemeriksaan selesai.${NC}"