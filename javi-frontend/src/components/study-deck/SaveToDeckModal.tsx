import { useState, useEffect } from "react";
import { Modal, Button, Input, List, Spin, Divider } from "antd";
import { PlusOutlined, FolderOpenOutlined, LoadingOutlined } from "@ant-design/icons";
import { callGetMyDecks, callCreateDeck } from "@/apis/studyDeckApi";
import { callAddFlashcard } from "@/apis/flashcardApi";
import { IStudyDeckResponse } from "@/types/backend";
import { toast } from "react-toastify";
import { useAuthStore } from "@/stores/useAuthStore";

interface Props {
    open: boolean;
    onClose: () => void;
    vocabId?: number;
    kanjiId?: number;
    grammarId?: number;
    defaultFrontText?: string;
    defaultBackText?: string;
}

export default function SaveToDeckModal({
    open,
    onClose,
    vocabId,
    kanjiId,
    grammarId,
    defaultFrontText,
    defaultBackText,
}: Props) {
    const user = useAuthStore((state) => state.user);
    const [decks, setDecks] = useState<IStudyDeckResponse[]>([]);
    const [loadingDecks, setLoadingDecks] = useState(false);
    const [savingDeckId, setSavingDeckId] = useState<number | null>(null);

    // Form tạo sổ tay mới nhanh
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newDeckName, setNewDeckName] = useState("");
    const [newDeckDesc, setNewDeckDesc] = useState("");
    const [creatingDeck, setCreatingDeck] = useState(false);

    // Fetch danh sách sổ tay của tôi
    const fetchDecks = async () => {
        if (!user) return;
        setLoadingDecks(true);
        try {
            const res = await callGetMyDecks();
            setDecks(res.data?.result || []);
        } catch (err: any) {
            console.error("Lỗi lấy danh sách sổ tay:", err);
            toast.error("Không thể tải danh sách sổ tay học tập!");
        } finally {
            setLoadingDecks(false);
        }
    };

    useEffect(() => {
        if (open && user) {
            fetchDecks();
            setShowCreateForm(false);
            setNewDeckName("");
            setNewDeckDesc("");
        }
    }, [open, user]);

    // Xử lý lưu thẻ ghi nhớ vào Sổ tay
    const handleSaveToDeck = async (deckId: number, deckName: string) => {
        setSavingDeckId(deckId);
        try {
            await callAddFlashcard({
                deckId,
                vocabId: vocabId || null,
                kanjiId: kanjiId || null,
                grammarId: grammarId || null,
                frontText: defaultFrontText || null,
                backText: defaultBackText || null,
            });
            toast.success(`Đã lưu vào sổ tay "${deckName}" thành công!`);
            onClose();
        } catch (err: any) {
            console.error("Lỗi lưu thẻ ghi nhớ:", err);
            const msg = err.response?.data?.message || "Từ này đã tồn tại trong sổ tay hoặc có lỗi xảy ra!";
            toast.error(msg);
        } finally {
            setSavingDeckId(null);
        }
    };

    // Tạo sổ tay mới nhanh
    const handleCreateDeck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeckName.trim()) {
            toast.warning("Vui lòng nhập tên sổ tay!");
            return;
        }

        setCreatingDeck(true);
        try {
            const res = await callCreateDeck({
                name: newDeckName.trim(),
                description: newDeckDesc.trim(),
            });
            const newDeck = res.data?.result;
            toast.success(`Đã tạo sổ tay "${newDeckName}"!`);
            
            // Nếu tạo thành công, tiến hành lưu thẻ vào sổ tay này luôn
            if (newDeck) {
                // Thêm vào danh sách state
                setDecks((prev) => [newDeck, ...prev]);
                setShowCreateForm(false);
                setNewDeckName("");
                setNewDeckDesc("");
                
                // Tự động lưu
                await handleSaveToDeck(newDeck.id, newDeck.name);
            }
        } catch (err: any) {
            console.error("Lỗi khi tạo sổ tay mới:", err);
            toast.error(err.response?.data?.message || "Tạo sổ tay mới thất bại!");
        } finally {
            setCreatingDeck(false);
        }
    };

    if (!user) {
        return (
            <Modal
                title="Yêu cầu đăng nhập"
                open={open}
                onCancel={onClose}
                footer={[
                    <Button key="close" onClick={onClose}>
                        Đóng
                    </Button>
                ]}
            >
                <div className="p-4 text-center">
                    <p className="text-gray-600 mb-4">Bạn cần đăng nhập tài khoản để sử dụng tính năng Sổ tay học tập.</p>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            title={<div className="text-lg font-medium text-gray-800 flex items-center gap-2"><FolderOpenOutlined className="text-blue-500" /> Lưu vào Sổ tay học tập</div>}
            open={open}
            onCancel={onClose}
            footer={null}
            width={480}
            className="with-padding-modal"
        >
            <div className="py-2">
                {loadingDecks ? (
                    <div className="flex justify-center items-center py-8">
                        <Spin indicator={<LoadingOutlined className="text-2xl" spin />} />
                    </div>
                ) : (
                    <>
                        <p className="text-gray-500 mb-4 text-sm">Chọn một sổ tay học tập bên dưới để thêm thẻ ôn tập:</p>
                        
                        <div className="max-h-60 overflow-y-auto pr-1">
                            <List
                                dataSource={decks}
                                renderItem={(deck) => (
                                    <List.Item
                                        actions={[
                                            <Button
                                                key="save"
                                                type="primary"
                                                size="small"
                                                ghost
                                                loading={savingDeckId === deck.id}
                                                onClick={() => handleSaveToDeck(deck.id, deck.name)}
                                                className="border-blue-500 text-blue-500 hover:bg-blue-50"
                                            >
                                                Lưu
                                            </Button>
                                        ]}
                                        className="hover:bg-gray-50 px-2 py-3 rounded-lg transition-colors border-b border-gray-100"
                                    >
                                        <List.Item.Meta
                                            title={<span className="font-medium text-gray-800">{deck.name}</span>}
                                            description={<span className="text-xs text-gray-400 block truncate">{deck.description || "Không có mô tả"}</span>}
                                        />
                                    </List.Item>
                                )}
                                locale={{ emptyText: <span className="text-gray-400 italic py-4 block text-center">Bạn chưa có sổ tay nào.</span> }}
                            />
                        </div>

                        <Divider className="my-3" />

                        {/* Phần tạo sổ tay nhanh */}
                        {!showCreateForm ? (
                            <Button
                                type="dashed"
                                icon={<PlusOutlined />}
                                onClick={() => setShowCreateForm(true)}
                                className="w-full text-blue-500 border-blue-400 hover:text-blue-600 hover:border-blue-500"
                            >
                                Tạo sổ tay học tập mới
                            </Button>
                        ) : (
                            <form onSubmit={handleCreateDeck} className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Tạo sổ tay mới & lưu</h4>
                                <div className="space-y-3">
                                    <div>
                                        <Input
                                            placeholder="Tên sổ tay (ví dụ: Từ vựng N3)"
                                            value={newDeckName}
                                            onChange={(e) => setNewDeckName(e.target.value)}
                                            maxLength={50}
                                            required
                                            className="rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <Input.TextArea
                                            placeholder="Mô tả ngắn (tùy chọn)"
                                            value={newDeckDesc}
                                            onChange={(e) => setNewDeckDesc(e.target.value)}
                                            rows={2}
                                            maxLength={200}
                                            className="rounded-lg"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button size="small" onClick={() => setShowCreateForm(false)}>
                                            Hủy
                                        </Button>
                                        <Button
                                            type="primary"
                                            size="small"
                                            htmlType="submit"
                                            loading={creatingDeck}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            Tạo & Lưu luôn
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
}
