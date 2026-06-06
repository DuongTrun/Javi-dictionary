import axiosClient from "./axiosClient";
import {
  IBackendRes,
  IPaymentOrderRequest,
  IPaymentOrderResponse,
  IPageResponse,
} from "@/types/backend";

/** User tạo đơn thanh toán sau khi chuyển khoản */
export const callCreatePaymentOrder = (data: IPaymentOrderRequest) => {
  return axiosClient.post<IBackendRes<IPaymentOrderResponse>>(
    "/payment-orders",
    data
  );
};

/** User xem danh sách đơn của mình */
export const callGetMyOrders = () => {
  return axiosClient.get<IBackendRes<IPaymentOrderResponse[]>>(
    "/payment-orders/my-orders"
  );
};

/** Admin lấy tất cả đơn (phân trang + filter) */
export const callGetAllPaymentOrders = (params?: {
  page?: number;
  size?: number;
  sort?: string;
  filter?: string;
}) => {
  return axiosClient.get<IBackendRes<IPageResponse<IPaymentOrderResponse>>>(
    "/payment-orders",
    { params }
  );
};

/** Admin duyệt đơn */
export const callApproveOrder = (id: number) => {
  return axiosClient.put<IBackendRes<IPaymentOrderResponse>>(
    `/payment-orders/${id}/approve`
  );
};

/** Admin từ chối đơn */
export const callRejectOrder = (id: number, adminNote?: string) => {
  return axiosClient.put<IBackendRes<IPaymentOrderResponse>>(
    `/payment-orders/${id}/reject`,
    null,
    { params: { adminNote: adminNote || "" } }
  );
};
