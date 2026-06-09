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
            setCards((prev) => prev.filter((c) => c.id !== cardId));
            fetchDecks();
        } catch (err: any) {
            console.error("Lỗi xóa thẻ:", err);
            toast.error("Xóa thẻ ghi nhớ thất bại!");
        }
    };

    // Lọc danh sách thẻ theo từ khóa tìm kiếm
    const filteredCards = cards.filter((card) => {
        const text = searchText.toLowerCase();
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

    const columns = [
        {
            title: "Mặt trước (Từ/Kanji)",
            key: "front",
            render: (_: any, record: IFlashcardResponse) => {
                if (record.vocab) {
                    return (
                        <div className="py-1">
                            <span className="font-bold text-primary text-[15px] font-mplus">{record.vocab.word}</span>
                            <span className="text-outline text-xs ml-2 font-medium">
                                ({(record.vocab.hiragana || record.vocab.katakana || "")}
                                {(record.vocab.hiragana || record.vocab.katakana) && ` - ${toRomaji(record.vocab.hiragana || record.vocab.katakana || "")}`})
                            </span>
                            <Tag color="blue" className="ml-2 rounded-md border-none font-semibold text-[10px] scale-90">Từ vựng</Tag>
                        </div>
                    );
                }
                if (record.kanji) {
                    return (
                        <div className="py-1">
                            <span className="font-bold text-secondary text-[16px] font-mplus">{record.kanji.characterName}</span>
                            <span className="text-outline text-xs ml-2 font-medium">({record.kanji.sinoViName})</span>
                            <Tag color="magenta" className="ml-2 rounded-md border-none font-semibold text-[10px] scale-90">Kanji</Tag>
                        </div>
                    );
                }
                if (record.grammar) {
                    return (
                        <div className="py-1">
                            <span className="font-bold text-tertiary text-[15px]">{record.grammar.pattern}</span>
                            <Tag color="green" className="ml-2 rounded-md border-none font-semibold text-[10px] scale-90">Ngữ pháp</Tag>
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
                    return <span className="text-on-surface-variant font-medium text-sm line-clamp-1">{cleanMeaning}</span>;
                }
                if (record.kanji) {
                    return <span className="text-on-surface-variant font-medium text-sm line-clamp-1">{record.kanji.meaning}</span>;
                }
                if (record.grammar) {
                    const cleanMeaning = record.grammar.meaning?.replace(/<[^>]*>/g, "") || "";
                    return <span className="text-on-surface-variant font-medium text-sm line-clamp-1">{cleanMeaning}</span>;
                }
                return <span className="text-on-surface-variant font-medium text-sm line-clamp-1">{record.backText || "—"}</span>;
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
                    <span className={`text-xs font-semibold ${isOverdue ? "text-error" : "text-outline"}`}>
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
        <div className="w-full px-4 md:px-8 py-6 max-w-[1200px] mx-auto space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-surface-container-lowest p-6 md:p-8 rounded-[24px] border border-outline-variant/10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-fixed opacity-40 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-fixed text-primary rounded-[18px] flex items-center justify-center text-3xl shadow-inner shrink-0">
                        <PiNotebookFill />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-on-surface m-0 font-headline-lg">Sổ tay học tập</h1>
                        <p className="text-on-surface-variant text-sm font-medium m-0 mt-1.5 max-w-xl leading-relaxed">
                            Lưu từ vựng, chữ Kanji, ngữ pháp và tự học ôn tập hàng ngày theo thuật toán SuperMemo-2 (SM-2) khoa học.
                        </p>
                    </div>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsCreateOpen(true)}
                    className="relative z-10 bg-primary hover:!bg-primary-fixed-variant text-white h-11 px-6 rounded-xl border-none font-bold shadow-md shadow-primary/20 active:scale-95 transition-all duration-200"
                >
                    Tạo Sổ tay mới
                </Button>
            </div>

            {/* List decks */}
            {loading ? (
                <div className="flex justify-center items-center py-24">
                    <Spin indicator={<LoadingOutlined className="text-4xl text-primary" spin />} />
                </div>
            ) : decks.length === 0 ? (
                <div className="bg-surface-container-lowest border border-dashed border-outline-variant rounded-[24px] p-12 text-center shadow-sm">
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div className="space-y-3">
                                <p className="text-on-surface font-semibold text-lg">Bạn chưa có sổ tay học tập nào!</p>
                                <p className="text-on-surface-variant text-sm font-medium max-w-sm mx-auto">Hãy tạo một sổ tay mới hoặc bấm nút "Lưu sổ tay" trong lúc tra cứu từ điển nhé.</p>
                            </div>
                        }
                    >
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-primary hover:bg-primary-fixed-variant font-bold rounded-xl h-10 px-5 mt-4 border-none shadow-sm shadow-primary/10"
                        >
                            Tạo sổ tay ngay
                        </Button>
                    </Empty>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {decks.map((deck) => {
                        const hasReview = (deck.reviewCount || 0) > 0;
                        return (
                            <Card
                                key={deck.id}
                                hoverable
                                className="group rounded-[20px] border border-outline-variant/10 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between bg-surface-container-lowest"
                                bodyStyle={{ padding: "20px", display: "flex", flexDirection: "column", height: "100%", width: "100%" }}
                            >
                                <div className="space-y-4 flex-1">
                                    {/* Icon & delete/view buttons */}
                                    <div className="flex items-start justify-between">
                                        <div className="w-10 h-10 bg-primary-fixed/30 text-primary rounded-xl flex items-center justify-center text-xl">
                                            <BookOutlined />
                                        </div>
                                        <Space>
                                            <Tooltip title="Xem danh sách từ đã lưu">
                                                <Button
                                                    type="text"
                                                    icon={<EyeOutlined className="text-outline hover:!text-primary" />}
                                                    onClick={() => handleOpenDrawer(deck)}
                                                    size="small"
                                                    className="hover:bg-surface-container-low rounded-lg"
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
                                                    icon={<DeleteOutlined className="text-outline hover:!text-error" />}
                                                    size="small"
                                                    className="hover:bg-error-container/20 rounded-lg"
                                                />
                                            </Popconfirm>
                                        </Space>
                                    </div>

                                    {/* Title & Description */}
                                    <div>
                                        <h3 className="text-lg font-bold text-on-surface mb-1 truncate group-hover:text-primary transition-colors font-headline-md">
                                            {deck.name}
                                        </h3>
                                        <p className="text-on-surface-variant text-sm font-medium line-clamp-2 h-10 mb-0">
                                            {deck.description || "Không có mô tả cho sổ tay này."}
                                        </p>
                                    </div>

                                    {/* Stats tags */}
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <span className="px-3 py-1 rounded-full bg-primary-fixed/20 text-primary text-xs font-bold border border-primary/10">
                                            Tổng: {deck.totalCards || 0} thẻ
                                        </span>
                                        {hasReview ? (
                                            <span className="px-3 py-1 rounded-full bg-error-container text-error text-xs font-bold border border-error/10 animate-pulse">
                                                Cần ôn: {deck.reviewCount} thẻ
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full bg-tertiary-container/20 text-tertiary text-xs font-bold border border-tertiary-container/30">
                                                Đã hoàn thành
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <Divider className="my-4 border-outline-variant/10" />

                                {/* Action button */}
                                <div>
                                    {hasReview ? (
                                        <Button
                                            type="primary"
                                            className="w-full bg-gradient-to-r from-primary to-primary-container hover:opacity-90 h-10 rounded-xl border-none font-bold shadow-md shadow-primary/10 flex items-center justify-center gap-2 text-white active:scale-95 transition-transform"
                                            onClick={() => navigate(`/study-decks/${deck.id}/review`)}
                                        >
                                            <PiBookBookmarkBold className="text-lg" />
                                            Ôn tập ngay ({deck.reviewCount})
                                        </Button>
                                    ) : (
                                        <Button
                                            disabled
                                            className="w-full h-10 rounded-xl font-bold bg-surface-container-low text-outline flex items-center justify-center gap-2 border-none"
                                        >
                                            <PiCalendarDuotone className="text-lg" />
                                            Đã học xong hôm nay
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
                title={<div className="font-bold text-on-surface text-lg font-headline-md">Tạo Sổ tay học tập mới</div>}
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
                        <label className="block text-sm font-semibold text-on-surface mb-1">Tên sổ tay <span className="text-error">*</span></label>
                        <Input
                            placeholder="Ví dụ: Từ vựng N2 chuyên ngành, Giao tiếp..."
                            value={newDeckName}
                            onChange={(e) => setNewDeckName(e.target.value)}
                            maxLength={50}
                            required
                            className="h-10 rounded-lg border-outline-variant/50 focus:border-primary focus:shadow-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-on-surface mb-1">Mô tả</label>
                        <Input.TextArea
                            placeholder="Mô tả mục đích hoặc nội dung của sổ tay này..."
                            value={newDeckDesc}
                            onChange={(e) => setNewDeckDesc(e.target.value)}
                            rows={3}
                            maxLength={200}
                            className="rounded-lg border-outline-variant/50 focus:border-primary focus:shadow-none"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            onClick={() => {
                                setIsCreateOpen(false);
                                setNewDeckName("");
                                setNewDeckDesc("");
                            }}
                            className="h-10 px-4 rounded-lg hover:border-primary hover:text-primary"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={creating}
                            className="bg-primary hover:bg-primary-fixed-variant h-10 px-5 rounded-lg border-none text-white font-bold"
                        >
                            Tạo mới
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Drawer xem danh sách thẻ trong sổ tay */}
            <Drawer
                title={<div className="font-bold text-on-surface font-headline-md">Danh sách thẻ: {activeDeck?.name}</div>}
                placement="right"
                onClose={() => setIsDrawerOpen(false)}
                open={isDrawerOpen}
                width={720}
                className="rounded-l-[24px]"
            >
                <div className="space-y-4">
                    {/* Search bar inside Drawer */}
                    <Input
                        placeholder="Tìm kiếm thẻ đã lưu trong sổ tay..."
                        prefix={<SearchOutlined className="text-outline" />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="h-11 rounded-xl border-outline-variant/50 focus:border-primary focus:shadow-none"
                        allowClear
                    />

                    {loadingCards ? (
                        <div className="flex justify-center items-center py-20">
                            <Spin indicator={<LoadingOutlined className="text-3xl text-primary" spin />} />
                        </div>
                    ) : (
                        <Table
                            dataSource={filteredCards}
                            columns={columns}
                            rowKey="id"
                            pagination={{ pageSize: 8, showSizeChanger: false }}
                            locale={{ emptyText: <span className="text-outline italic py-4 block text-center">Không tìm thấy thẻ ghi nhớ nào.</span> }}
                            className="border border-outline-variant/10 rounded-xl overflow-hidden shadow-sm"
                        />
                    )}
                </div>
            </Drawer>
        </div>
    );
}
