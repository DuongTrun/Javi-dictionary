import axiosClient from "@/apis/axiosClient";
import { IBackendRes, IFlashcardRequest, IFlashcardResponse, IFlashcardReviewRequest } from "@/types/backend";

/** Thêm thẻ mới vào sổ tay */
export const callAddFlashcard = (body: IFlashcardRequest) => {
    return axiosClient.post<IBackendRes<IFlashcardResponse>>(`/flashcards`, body);
};

/** Lấy các thẻ cần ôn tập hôm nay của một sổ tay */
export const callGetCardsForReview = (deckId: number) => {
    return axiosClient.get<IBackendRes<IFlashcardResponse[]>>(`/flashcards/review/${deckId}`);
};

/** Lấy toàn bộ thẻ ghi nhớ của một sổ tay */
export const callGetCardsByDeckId = (deckId: number) => {
    return axiosClient.get<IBackendRes<IFlashcardResponse[]>>(`/flashcards/deck/${deckId}`);
};

/** Gửi kết quả đánh giá thẻ để cập nhật thuật toán SM-2 */
export const callSubmitReview = (body: IFlashcardReviewRequest) => {
    return axiosClient.post<IBackendRes<IFlashcardResponse>>(`/flashcards/review`, body);
};

/** Xóa thẻ ghi nhớ khỏi sổ tay */
export const callDeleteFlashcard = (id: number) => {
    return axiosClient.delete<IBackendRes<void>>(`/flashcards/${id}`);
};
