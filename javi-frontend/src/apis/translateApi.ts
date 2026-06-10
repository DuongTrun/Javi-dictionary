import axiosClient from "@/apis/axiosClient";

import type {
  IBackendRes,
  ITranslateRequest,
  ITranslateResponse,
  IPageResponse,
  ITranslateImageRequest,
  IGrammarCheckSourceText,
  IGrammarCheckResult,
} from "@/types/backend";

/**
 * Dịch văn bản (Text Translation)
 * - Gửi đoạn text, ngôn ngữ nguồn/đích, engine (GOOGLE / AI)
 * - Trả về bản dịch + thông tin lưu lịch sử
 * Backend: POST /translate
 */
export const callTranslateText = async (body: ITranslateRequest) => {
  return await axiosClient.post<IBackendRes<ITranslateResponse>>(`/translate`, body, {
    skipGlobalError: true,
  });
};

/**
 * Dịch ảnh (Image Translation)
 * - Upload file ảnh + thông tin ngôn ngữ + engine
 * - Backend thực hiện OCR → dịch → lưu lịch sử
 * - FREE user bị chặn, PREMIUM mới dùng được
 * Backend: POST /translate/image
 */
export const callTranslateImage = async (payload: ITranslateImageRequest) => {
  const formData = new FormData();
  formData.append("file", payload.file);
  if (payload.targetLang) formData.append("targetLang", payload.targetLang);
  if (payload.sourceLang) formData.append("sourceLang", payload.sourceLang as string);
  if (payload.engine) formData.append("engine", payload.engine);

  return await axiosClient.post<IBackendRes<ITranslateResponse>>(`/translate/image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    skipGlobalError: true,
  });
};

/**
 * Lấy lịch sử dịch (có phân trang)
 * - Trả về danh sách các bản dịch của user theo Page
 * Backend: GET /translate/history
 */
export const callGetTranslateHistory = async (page = 0, size = 10, sort = "createdAt,desc") => {
  return await axiosClient.get<IBackendRes<IPageResponse<ITranslateResponse>>>(`/translate/history`, {
    params: { page, size, sort },
  });
};

/**
 * Xóa nhiều bản dịch được chọn
 * Backend: DELETE /translate  (body: [ids])
 */
export const callDeleteSelectedTranslateHistory = async (ids: number[]) => {
  return await axiosClient.request<IBackendRes<void>>({
    url: `/translate`,
    method: "DELETE",
    data: ids,
  });
};

/**
 * Xóa toàn bộ lịch sử dịch
 * Backend: DELETE /translate/delete-all
 */
export const callDeleteAllTranslateHistory = async () => {
  return await axiosClient.delete<IBackendRes<void>>(`/translate/delete-all`);
};

/**
 * Kiểm tra ngữ pháp (Grammar Check)
 * - PREMIUM mới dùng được
 * Backend: POST /grammar/check
 */
export const callCheckGrammar = async (body: IGrammarCheckSourceText) => {
  return await axiosClient.post<IBackendRes<IGrammarCheckResult>>(`/grammar/check`, body, {
    skipGlobalError: true,
  });
};

/** URL stream dịch văn bản bằng AI */
export const getTranslateStreamUrl = () => {
  return `${import.meta.env.VITE_API_URL}/translate/stream`;
};

export default {
  callTranslateText,
  callTranslateImage,
  callGetTranslateHistory,
  callDeleteSelectedTranslateHistory,
  callDeleteAllTranslateHistory,
  callCheckGrammar,
  getTranslateStreamUrl,
};

