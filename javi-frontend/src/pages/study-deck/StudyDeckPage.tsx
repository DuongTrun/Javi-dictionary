import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Input, Modal, Popconfirm, Spin, Empty, Tag, Drawer, Table, Space, Tooltip, Divider } from "antd";
import { PlusOutlined, DeleteOutlined, BookOutlined, EyeOutlined, LoadingOutlined, SearchOutlined } from "@ant-design/icons";
import { PiNotebookFill, PiBookBookmarkBold, PiCalendarDuotone } from "react-icons/pi";
import { callGetMyDecks, callCreateDeck, callDeleteDeck } from "@/apis/studyDeckApi";
import { callGetCardsByDeckId, callDeleteFlashcard } from "@/apis/flashcardApi";
import { IStudyDeckResponse, IFlashcardResponse } from "@/types/backend";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { toRomaji } from "wanakana";

export default function StudyDeckPage() {
    const navigate = useNavigate();
    const [decks, setDecks] = useState<IStudyDeckResponse[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal tạo sổ tay
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newDeckName, setNewDeckName] = useState("");
    const [newDeckDesc, setNewDeckDesc] = useState("");
    const [creating, setCreating] = useState(false);

    // Drawer xem danh sách thẻ trong sổ tay
    const [activeDeck, setActiveDeck] = useState<IStudyDeckResponse | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [cards, setCards] = useState<IFlashcardResponse[]>([]);
    const [loadingCards, setLoadingCards] = useState(false);
    const [searchText, setSearchText] = useState("");

    const fetchDecks = async () => {
        setLoading(true);
        try {
            const res = await callGetMyDecks();
            setDecks(res.data?.result || []);
        } catch (err: any) {
            console.error("Lỗi lấy danh sách sổ tay:", err);
            toast.error("Không thể tải danh sách sổ tay học tập!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDecks();
    }, []);

    // Tạo sổ tay mới
    const handleCreateDeck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeckName.trim()) {
            toast.warning("Vui lòng nhập tên sổ tay!");
            return;
        }

        setCreating(true);
        try {
            await callCreateDeck({
                name: newDeckName.trim(),
                description: newDeckDesc.trim(),
            });
            toast.success(`Đã tạo sổ tay "${newDeckName}" thành công!`);
            setIsCreateOpen(false);
            setNewDeckName("");
            setNewDeckDesc("");
            fetchDecks();
        } catch (err: any) {
            console.error("Lỗi tạo sổ tay mới:", err);
            toast.error(err.response?.data?.message || "Tạo sổ tay mới thất bại!");
        } finally {
            setCreating(false);
        }
    };

    // Xóa sổ tay
    const handleDeleteDeck = async (id: number, name: string) => {
        try {
            await callDeleteDeck(id);
            toast.success(`Đã xóa sổ tay "${name}"!`);
            fetchDecks();
        } catch (err: any) {
            console.error("Lỗi xóa sổ tay:", err);
            toast.error(err.response?.data?.message || "Xóa sổ tay thất bại!");
        }
    };

    // Xem danh sách thẻ trong sổ tay (Drawer)
    const handleOpenDrawer = async (deck: IStudyDeckResponse) => {
        setActiveDeck(deck);
        setIsDrawerOpen(true);
        setLoadingCards(true);
        setSearchText("");
        try {
            const res = await callGetCardsByDeckId(deck.id);
            setCards(res.data?.result || []);
        } catch (err: any) {
            console.error("Lỗi lấy danh sách thẻ:", err);
            toast.error("Không thể tải danh sách thẻ ghi nhớ!");
        } finally {
            setLoadingCards(false);
        }
    };

    // Xóa thẻ khỏi sổ tay
    const handleDeleteCard = async (cardId: number) => {
        try {
            await callDeleteFlashcard(cardId);
            toast.success("Đã xóa thẻ ghi nhớ khỏi sổ tay!");
            // Cập nhật lại list cards trong Drawer
            setCards((prev) => prev.filter((c) => c.id !== cardId));
            // Cập nhật lại số lượng ở trang danh sách sổ tay
            fetchDecks();
        } catch (err: any) {
            console.error("Lỗi xóa thẻ:", err);
            toast.error("Xóa thẻ ghi nhớ thất bại!");
        }
    };

    // Lọc danh sách thẻ theo từ khóa tìm kiếm
    const filteredCards = cards.filter((card) => {
        const text = searchText.toLowerCase();
        // Lấy mặt trước hoặc nội dung từ vựng liên kết
        const front = (card.frontText || "").toLowerCase();
        const vocabWord = card.vocab?.word?.toLowerCase() || "";
        const kanjiChar = card.kanji?.characterName?.toLowerCase() || "";
        const grammarPattern = card.grammar?.pattern?.toLowerCase() || "";
        const back = (card.backText || "").toLowerCase();

        return (
            front.includes(text) ||
            vocabWord.includes(text) ||
            kanjiChar.includes(text) ||
            grammarPattern.includes(text) ||
            back.includes(text)
        );
    });

    // Định nghĩa cột hiển thị thẻ trong Table Drawer
    const columns = [
        {
            title: "Mặt trước (Từ/Kanji)",
            key: "front",
            render: (_: any, record: IFlashcardResponse) => {
                if (record.vocab) {
                    return (
                        <div>
                            <span className="font-bold text-blue-600 text-[15px]">{record.vocab.word}</span>
                            <span className="text-gray-400 text-xs ml-2">
                                ({(record.vocab.hiragana || record.vocab.katakana || "")}
                                {(record.vocab.hiragana || record.vocab.katakana) && ` - ${toRomaji(record.vocab.hiragana || record.vocab.katakana || "")}`})
                            </span>
                            <Tag color="cyan" className="ml-2 scale-90">Từ vựng</Tag>
                        </div>
                    );
                }
                if (record.kanji) {
                    return (
                        <div>
                            <span className="font-bold text-purple-600 text-[16px]">{record.kanji.characterName}</span>
                            <span className="text-gray-400 text-xs ml-2">({record.kanji.sinoViName})</span>
                            <Tag color="purple" className="ml-2 scale-90">Kanji</Tag>
                        </div>
                    );
                }
                if (record.grammar) {
                    return (
                        <div>
                            <span className="font-bold text-orange-600 text-[15px]">{record.grammar.pattern}</span>
                            <Tag color="orange" className="ml-2 scale-90">Ngữ pháp</Tag>
                        </div>
                    );
                }
                return <span className="font-medium">{record.frontText || "—"}</span>;
            },
        },
        {
            title: "Mặt sau (Giải nghĩa)",
            key: "back",
            render: (_: any, record: IFlashcardResponse) => {
                if (record.vocab) {
                    const cleanMeaning = record.vocab.meanings?.[0]?.meaningVn?.replace(/<[^>]*>/g, "") || "";
                    return <span className="text-gray-600 text-sm line-clamp-1">{cleanMeaning}</span>;
                }
                if (record.kanji) {
                    return <span className="text-gray-600 text-sm line-clamp-1">{record.kanji.meaning}</span>;
                }
                if (record.grammar) {
                    const cleanMeaning = record.grammar.meaning?.replace(/<[^>]*>/g, "") || "";
                    return <span className="text-gray-600 text-sm line-clamp-1">{cleanMeaning}</span>;
                }
                return <span className="text-gray-600 text-sm line-clamp-1">{record.backText || "—"}</span>;
            },
        },
        {
            title: "Ngày ôn tiếp theo",
            key: "nextReview",
            width: 150,
            render: (_: any, record: IFlashcardResponse) => {
                const date = dayjs(record.nextReviewDate);
                const isOverdue = date.isBefore(dayjs(), "day") || date.isSame(dayjs(), "day");
                return (
                    <span className={`text-sm ${isOverdue ? "text-red-500 font-medium" : "text-gray-500"}`}>
                        {isOverdue ? "Cần ôn hôm nay" : date.format("DD/MM/YYYY")}
                    </span>
                );
            },
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 80,
            render: (_: any, record: IFlashcardResponse) => (
                <Popconfirm
                    title="Xóa thẻ ghi nhớ này khỏi sổ tay?"
                    onConfirm={() => handleDeleteCard(record.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                >
                    <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
            ),
        },
    ];

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl">
                        <PiNotebookFill />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 m-0">Sổ tay học tập</h1>
                        <p className="text-gray-500 text-sm m-0 mt-0.5">Lưu từ vựng, chữ Kanji, ngữ pháp và ôn tập hàng ngày theo thuật toán SuperMemo-2 (SM-2).</p>
                    </div>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 h-10 px-5 rounded-xl border-none font-medium shadow-md shadow-blue-200"
                >
                    Tạo Sổ tay mới
                </Button>
            </div>

            {/* List decks */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spin indicator={<LoadingOutlined className="text-4xl text-blue-600" spin />} />
                </div>
            ) : decks.length === 0 ? (
                <Card className="border border-dashed border-gray-300 rounded-2xl p-10 text-center">
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div className="space-y-2">
                                <p className="text-gray-500 font-medium text-base">Bạn chưa có sổ tay học tập nào!</p>
                                <p className="text-gray-400 text-sm">Hãy tạo một sổ tay mới hoặc bấm nút "Lưu sổ tay" trong lúc tra cứu từ điển nhé.</p>
                            </div>
                        }
                    >
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 rounded-lg mt-2 border-none"
                        >
                            Tạo sổ tay ngay
                        </Button>
                    </Empty>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {decks.map((deck) => {
                        const hasReview = (deck.reviewCount || 0) > 0;
                        return (
                            <Card
                                key={deck.id}
                                hoverable
                                className="group rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between"
                                bodyStyle={{ padding: "20px", display: "flex", flexDirection: "column", height: "100%" }}
                            >
                                <div className="space-y-4 flex-1">
                                    {/* Icon & delete button */}
                                    <div className="flex items-start justify-between">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center text-xl">
                                            <BookOutlined />
                                        </div>
                                        <Space>
                                            <Tooltip title="Xem danh sách từ đã lưu">
                                                <Button
                                                    type="text"
                                                    icon={<EyeOutlined className="text-gray-500 hover:text-blue-500" />}
                                                    onClick={() => handleOpenDrawer(deck)}
                                                    size="small"
                                                />
                                            </Tooltip>
                                            <Popconfirm
                                                title={`Xóa sổ tay "${deck.name}"? Tất cả thẻ trong sổ tay này cũng sẽ bị xóa vĩnh viễn!`}
                                                onConfirm={() => handleDeleteDeck(deck.id, deck.name)}
                                                okText="Xóa"
                                                cancelText="Hủy"
                                                okButtonProps={{ danger: true }}
                                            >
                                                <Button
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    size="small"
                                                />
                                            </Popconfirm>
                                        </Space>
                                    </div>

                                    {/* Title & Description */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 mb-1 truncate group-hover:text-blue-600 transition-colors">
                                            {deck.name}
                                        </h3>
                                        <p className="text-gray-400 text-sm line-clamp-2 h-10 mb-0">
                                            {deck.description || "Không có mô tả cho sổ tay này."}
                                        </p>
                                    </div>

                                    {/* Stats tags */}
                                    <div className="flex flex-wrap gap-2">
                                        <Tag color="blue" className="rounded-full px-2.5 py-0.5 border-none font-medium">
                                            Tổng: {deck.totalCards || 0} thẻ
                                        </Tag>
                                        {hasReview ? (
                                            <Tag color="red" className="rounded-full px-2.5 py-0.5 border-none font-medium animate-pulse">
                                                Cần ôn: {deck.reviewCount} thẻ
                                            </Tag>
                                        ) : (
                                            <Tag color="green" className="rounded-full px-2.5 py-0.5 border-none font-medium">
                                                Đã ôn xong
                                            </Tag>
                                        )}
                                    </div>
                                </div>

                                <Divider className="my-4" />

                                {/* Action button */}
                                <div>
                                    {hasReview ? (
                                        <Button
                                            type="primary"
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-10 rounded-xl border-none font-medium shadow-md shadow-blue-100 flex items-center justify-center gap-2"
                                            onClick={() => navigate(`/study-decks/${deck.id}/review`)}
                                        >
                                            <PiBookBookmarkBold className="text-lg" />
                                            Ôn tập ngay ({deck.reviewCount})
                                        </Button>
                                    ) : (
                                        <Button
                                            disabled
                                            className="w-full h-10 rounded-xl font-medium bg-gray-100 text-gray-400 flex items-center justify-center gap-2"
                                        >
                                            <PiCalendarDuotone className="text-lg" />
                                            Không có thẻ cần ôn hôm nay
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modal tạo Sổ tay mới */}
            <Modal
                title={<div className="font-bold text-gray-800 text-lg">Tạo Sổ tay học tập mới</div>}
                open={isCreateOpen}
                onCancel={() => {
                    setIsCreateOpen(false);
                    setNewDeckName("");
                    setNewDeckDesc("");
                }}
                footer={null}
                width={450}
                className="with-padding-modal"
            >
                <form onSubmit={handleCreateDeck} className="space-y-4 py-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên sổ tay <span className="text-red-500">*</span></label>
                        <Input
                            placeholder="Ví dụ: Từ vựng N2 chuyên ngành, Giao tiếp hàng ngày..."
                            value={newDeckName}
                            onChange={(e) => setNewDeckName(e.target.value)}
                            maxLength={50}
                            required
                            className="h-10 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <Input.TextArea
                            placeholder="Mô tả mục đích hoặc nội dung của sổ tay này..."
                            value={newDeckDesc}
                            onChange={(e) => setNewDeckDesc(e.target.value)}
                            rows={3}
                            maxLength={200}
                            className="rounded-lg"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            onClick={() => {
                                setIsCreateOpen(false);
                                setNewDeckName("");
                                setNewDeckDesc("");
                            }}
                            className="h-10 px-4 rounded-lg"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={creating}
                            className="bg-blue-600 hover:bg-blue-700 h-10 px-5 rounded-lg border-none"
                        >
                            Tạo mới
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Drawer xem danh sách thẻ trong sổ tay */}
            <Drawer
                title={<div className="font-bold text-gray-800">Danh sách thẻ: {activeDeck?.name}</div>}
                placement="right"
                onClose={() => setIsDrawerOpen(false)}
                open={isDrawerOpen}
                width={700}
            >
                <div className="space-y-4">
                    {/* Search bar inside Drawer */}
                    <Input
                        placeholder="Tìm kiếm thẻ đã lưu trong sổ tay..."
                        prefix={<SearchOutlined className="text-gray-400" />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="h-10 rounded-xl"
                        allowClear
                    />

                    {loadingCards ? (
                        <div className="flex justify-center items-center py-20">
                            <Spin indicator={<LoadingOutlined className="text-3xl text-blue-600" spin />} />
                        </div>
                    ) : (
                        <Table
                            dataSource={filteredCards}
                            columns={columns}
                            rowKey="id"
                            pagination={{ pageSize: 8, showSizeChanger: false }}
                            locale={{ emptyText: <span className="text-gray-400 italic py-4 block text-center">Không tìm thấy thẻ ghi nhớ nào.</span> }}
                        />
                    )}
                </div>
            </Drawer>
        </div>
    );
}
