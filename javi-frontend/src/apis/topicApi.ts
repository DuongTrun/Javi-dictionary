/**
 * File này: API Client topicApi.
 * Vai trò: Khai báo các hàm gọi API đến các endpoint của Topic ở Backend sử dụng axiosClient.
 * Dùng khi: Component React cần lấy danh sách chủ đề hoặc thêm chủ đề mới.
 */
import axiosClient from "@/apis/axiosClient";
import { IBackendRes, ITopic } from "@/types/backend";

// Định nghĩa interface Request body khi tạo Topic
export interface ITopicRequest {
  nameVi: string;
  nameJa: string;
  description: string;
}

/** Lấy toàn bộ danh sách chủ đề học tiếng Nhật */
export const callGetTopics = () => {
  return axiosClient.get<IBackendRes<ITopic[]>>("/topics");
};

/** Tạo mới một chủ đề học tiếng Nhật */
export const callCreateTopic = (body: ITopicRequest) => {
  return axiosClient.post<IBackendRes<ITopic>>("/topics", body);
};
