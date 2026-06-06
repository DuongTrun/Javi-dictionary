import os
import json
import zipfile
import sys

def generate_sql(zip_path, output_sql_path):
    if not os.path.exists(zip_path):
        print(f"Lỗi: Không tìm thấy file zip tại: {zip_path}")
        return
        
    print(f"Đang phân tích file zip từ điển: {zip_path}...")
    
    try:
        with zipfile.ZipFile(zip_path, 'r') as z:
            file_list = z.namelist()
            
            # 1. KIỂM TRA LOẠI TỪ ĐIỂN (TERM BANK hay KANJI BANK)
            term_files = [f for f in file_list if 'term_bank' in f]
            kanji_files = [f for f in file_list if 'kanji_bank' in f]
            
            if not term_files and not kanji_files:
                print("Lỗi: Không tìm thấy file dữ liệu 'term_bank' hoặc 'kanji_bank' nào bên trong file zip!")
                return
                
            with open(output_sql_path, 'w', encoding='utf-8') as sql_file:
                sql_file.write("SET NAMES utf8mb4;\n")
                sql_file.write("SET CHARACTER SET utf8mb4;\n")
                sql_file.write("SET FOREIGN_KEY_CHECKS = 0;\n")
                
                # --- TRƯỜNG HỢP 1: TỪ ĐIỂN TỪ VỰNG (TERM BANK) ---
                if term_files:
                    print("=> Phát hiện đây là Từ điển Từ vựng (term_bank).")
                    sql_file.write("TRUNCATE TABLE meaning;\n")
                    sql_file.write("TRUNCATE TABLE vocabularies;\n")
                    
                    vocab_id = 1000
                    meaning_id = 1000
                    
                    for file_name in term_files:
                        print(f"Đang xử lý: {file_name}")
                        with z.open(file_name) as f:
                            data = json.load(f)
                            
                            vocab_values = []
                            meaning_values = []
                            
                            for item in data:
                                if len(item) < 6:
                                    continue
                                
                                word = item[0]
                                reading = item[1]
                                meanings = item[5]
                                
                                if not isinstance(meanings, list):
                                    continue
                                
                                formatted_meanings = []
                                for m in meanings:
                                    if isinstance(m, str):
                                        formatted_meanings.append(f"• {m}")
                                    elif isinstance(m, list):
                                        flat_m = ", ".join([str(x) for x in m])
                                        formatted_meanings.append(f"• {flat_m}")
                                meaning_vn = "<br/>".join(formatted_meanings)
                                meaning_vn = meaning_vn.replace("'", "''")
                                word_clean = word.replace("'", "''")
                                reading_clean = reading.replace("'", "''")
                                
                                level = "N3"
                                if len(word) == 1:
                                    level = "N5"
                                elif len(word) == 2:
                                    level = "N4"
                                elif len(word) == 3:
                                    level = "N2"
                                elif len(word) >= 4:
                                    level = "N1"
                                    
                                vocab_values.append(f"({vocab_id}, '{word_clean}', '{reading_clean}', '{reading_clean}', '', 'NOUN', '{level}', NOW(), NOW())")
                                meaning_values.append(f"({meaning_id}, {vocab_id}, '{meaning_vn}', '', NOW(), NOW())")
                                
                                vocab_id += 1
                                meaning_id += 1
                                
                                if len(vocab_values) >= 1000:
                                    sql_file.write(f"INSERT INTO vocabularies (vocab_id, word, romaji, hiragana, katakana, word_type, level, created_at, updated_at) VALUES {', '.join(vocab_values)};\n")
                                    sql_file.write(f"INSERT INTO meaning (id, vocab_id, meaning_vn, description, created_at, updated_at) VALUES {', '.join(meaning_values)};\n")
                                    vocab_values = []
                                    meaning_values = []
                            
                            if vocab_values:
                                sql_file.write(f"INSERT INTO vocabularies (vocab_id, word, romaji, hiragana, katakana, word_type, level, created_at, updated_at) VALUES {', '.join(vocab_values)};\n")
                                sql_file.write(f"INSERT INTO meaning (id, vocab_id, meaning_vn, description, created_at, updated_at) VALUES {', '.join(meaning_values)};\n")
                    
                    print(f"Thành công! Đã tạo lệnh chèn {vocab_id - 1000} từ vựng vào file SQL.")
                
                # --- TRƯỜNG HỢP 2: TỪ ĐIỂN CHỮ KANJI (KANJI BANK) ---
                elif kanji_files:
                    print("=> Phát hiện đây là Từ điển chữ Kanji (kanji_bank).")
                    sql_file.write("TRUNCATE TABLE kanji;\n")
                    
                    kanji_id = 1000
                    
                    for file_name in kanji_files:
                        print(f"Đang xử lý: {file_name}")
                        with z.open(file_name) as f:
                            data = json.load(f)
                            
                            kanji_values = []
                            
                            for item in data:
                                if len(item) < 4:
                                    continue
                                
                                character = item[0]
                                readings = item[1]  # chứa onyomi/kunyomi
                                meanings = item[3]  # chứa nghĩa tiếng việt và âm Hán Việt
                                
                                if not isinstance(meanings, list):
                                    continue
                                
                                # Tách âm Hán Việt (thường viết hoa ở đầu trong KanjiDictVN như "NHẬT", "BẢN")
                                sino_vi = ""
                                meaning_list = []
                                for m in meanings:
                                    if m.isupper() and len(m) < 15:
                                        sino_vi = m
                                    else:
                                        meaning_list.append(m)
                                        
                                if not sino_vi and meanings:
                                    sino_vi = meanings[0]
                                    
                                formatted_meanings = [f"• {m}" for m in meaning_list]
                                meaning_vn = "<br/>".join(formatted_meanings)
                                if not meaning_vn:
                                    meaning_vn = f"• {sino_vi}"
                                meaning_vn = meaning_vn.replace("'", "''")
                                sino_vi = sino_vi.replace("'", "''")
                                character_clean = character.replace("'", "''")
                                
                                kanji_values.append(f"({kanji_id}, '{character_clean}', '{sino_vi}', '{meaning_vn}', 'N3', '', NOW(), NOW())")
                                kanji_id += 1
                                
                                if len(kanji_values) >= 1000:
                                    sql_file.write(f"INSERT INTO kanji (kanji_id, character_name, sino_vi_name, meaning, level, gif_url, created_at, updated_at) VALUES {', '.join(kanji_values)};\n")
                                    kanji_values = []
                                    
                            if kanji_values:
                                sql_file.write(f"INSERT INTO kanji (kanji_id, character_name, sino_vi_name, meaning, level, gif_url, created_at, updated_at) VALUES {', '.join(kanji_values)};\n")
                    
                    print(f"Thành công! Đã tạo lệnh chèn {kanji_id - 1000} chữ Kanji vào file SQL.")
                
                sql_file.write("SET FOREIGN_KEY_CHECKS = 1;\n")
                
        print(f"\n=== XUẤT FILE THÀNH CÔNG ===")
        print(f"File SQL đã được ghi ra: {output_sql_path}")
        print("Anh hãy mở file này và chạy trong MySQL Workbench / DBeaver là có dữ liệu thật nhé!")
        
    except Exception as e:
        print(f"Gặp lỗi xử lý file: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Sử dụng: python generate_sql_from_yomichan.py <duong_dan_file_yomichan.zip>")
    else:
        zip_p = sys.argv[1]
        out_p = os.path.join(os.path.dirname(zip_p), "import_yomichan.sql")
        generate_sql(zip_p, out_p)
