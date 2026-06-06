import axiosClient from "@/apis/axiosClient";
import { IBackendRes, IStudyDeckRequest, IStudyDeckResponse } from "@/types/backend";

/** Lấy danh sách sổ tay học tập của tôi */
export const callGetMyDecks = () => {
    return axiosClient.get<IBackendRes<IStudyDeckResponse[]>>(`/study-decks`);
};

/** Tạo sổ tay học tập mới */
export const callCreateDeck = (body: IStudyDeckRequest) => {
    return axiosClient.post<IBackendRes<IStudyDeckResponse>>(`/study-decks`, body);
};

/** Xóa sổ tay học tập */
export const callDeleteDeck = (id: number) => {
    return axiosClient.delete<IBackendRes<void>>(`/study-decks/${id}`);
};
