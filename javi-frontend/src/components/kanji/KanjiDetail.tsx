import { useEffect, useRef, useState } from "react";
import { Tag, Tooltip, Button, Typography, Divider } from "antd";
import { PlayCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import Comment from "@/components/comment/Comment";
import { AiOutlinePartition } from "react-icons/ai";
import KanjiDecompositionModal from "./KanjiDecompositionModal";
import { IKanjiDetailResponse } from "@/types/backend";
import DOMPurify from "dompurify";
import { PiBookBookmark } from "react-icons/pi";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "react-toastify";
import SaveToDeckModal from "@/components/study-deck/SaveToDeckModal";

const { Title, Text } = Typography;

interface Props {
    data: IKanjiDetailResponse;
}

export default function KanjiDetail({ data }: Props) {
    const user = useAuthStore((state) => state.user);
    const isLoggedIn = !!user;
    const [analyzeOpen, setAnalyzeOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleReplay = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
        }
    };

    useEffect(() => {
        // Khi video url thay đổi (hoặc component mount), thử phát video tự động.
        // Việc gọi play() có thể bị block nếu browser không cho phép autoplay, nhưng
        // vì video muted nên hầu hết browser sẽ cho phép.
        const v = videoRef.current;
        if (v) {
            // đảm bảo start từ đầu
            v.currentTime = 0;
            // try play, catch lỗi để tránh console error
            v.play().catch(() => {
                // bình thường sẽ không có lỗi vì muted, nhưng vẫn bắt lỗi để an toàn
            });
        }
    }, [data.videoUrl]); // chạy khi url thay đổi

    return (
        <div className=" bg-white rounded-2xl shadow-lg p-4">
            <div className="w-full flex flex-col md:flex-row gap-8 text-gray-800">
                {/* ==== CỘT TRÁI: THÔNG TIN CHI TIẾT ==== */}
                <div className="flex-1 space-y-4">
                    <Title
                        level={5}
                        className="!m-0 text-gray-700 text-base !font-normal"
                    >
                        Chi tiết chữ Kanji:{" "}
                        <span className="text-3xl text-[#3e67d6] font-mplus font-normal">
                            {" "}
                            {data.characterName}{" "}
                        </span>
                    </Title>

                    {/* Hán tự */}
                    <div>
                        <Text className="block mb-1">Hán tự</Text>
                        <Tag color="blue" className="text-xl px-3 py-1">
                            {data.characterName} - {data.sinoViName}
                        </Tag>
                    </div>

                    {/* Kunyomi */}
                    {data.kunyomi && data.kunyomi.length > 0 && (
                        <div>
                            <Text className="block mb-1">Kunyomi</Text>
                            <div className="flex flex-wrap gap-2">
                                {data.kunyomi.map((k, idx) => (
                                    <Tag
                                        key={idx}
                                        color="purple"
                                        className="text-base px-3 py-1"
                                    >
                                        {k}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Onyomi */}
                    {data.onyomi && data.onyomi.length > 0 && (
                        <div>
                            <Text className="block mb-1">Onyomi</Text>
                            <div className="flex flex-wrap gap-2">
                                {data.onyomi.map((o, idx) => (
                                    <Tag
                                        key={idx}
                                        color="magenta"
                                        className="text-base px-3 py-1"
                                    >
                                        {o}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Số nét & JLPT */}
                    <div className="flex flex-wrap gap-6">
                        <div>
                            <Text className="mb-1">Số nét: </Text>
                            <Text className="text-base">{data.stroke}</Text>
                        </div>
                        <div>
                            <Text className="mb-1">JLPT:</Text>
                            <div className="text-base ml-1 inline">
                                {data.level && data.level.trim() !== ""
                                    ? data.level
                                    : "Chưa phân loại"}
                            </div>
                        </div>
                    </div>

                    {/* Nút phân tích & Lưu sổ tay */}
                    <div className="flex gap-2">
                        <Button
                            type="default"
                            icon={<AiOutlinePartition />}
                            className="bg-blue-50 border border-blue-300 text-blue-700 hover:bg-blue-100 transition-all"
                            onClick={() => setAnalyzeOpen(true)}
                        >
                            Phân tích
                        </Button>
                        <Button
                            type="primary"
                            icon={<PiBookBookmark />}
                            className="bg-[#3e66d4] hover:bg-[#2c4fa8] border-none transition-all flex items-center"
                            onClick={() => {
                                if (!isLoggedIn) {
                                    toast.info("Vui lòng đăng nhập để lưu vào sổ tay.");
                                } else {
                                    setSaveModalOpen(true);
                                }
                            }}
                        >
                            Lưu sổ tay
                        </Button>
                    </div>

                    <Divider className="!my-3" />

                    {/* Nghĩa */}
                    <div>
                        <Text strong className="block text-gray-600 mb-1">
                            Nghĩa và giải nghĩa
                        </Text>
                        {/* Văn bản nghĩa (render HTML an toàn, giữ khoảng trắng) */}
                        <div
                            className="text-sm text-gray-700 leading-relaxed whitespace-normal break-words ql-render"
                            dangerouslySetInnerHTML={{
                                __html:
                                    DOMPurify.sanitize(data?.meaning || "") ||
                                    `<span class="text-gray-400">—</span>`,
                            }}
                        />
                    </div>
                </div>

                {/* ==== CỘT PHẢI: GIF / VIDEO ==== */}
                <div className="md:w-[320px] flex flex-col items-center gap-3 relative">
                    {data.gifUrl ? (
                        <div className="relative w-full aspect-square max-w-[320px] border border-gray-200 rounded-lg overflow-hidden shadow-md bg-gray-50 flex items-center justify-center">
                            <img
                                src={data.gifUrl}
                                alt={`${data.characterName} stroke order`}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ) : (
                        <div className="relative w-full aspect-square max-w-[320px] border border-gray-200 rounded-lg overflow-hidden shadow-md bg-gray-50">
                            <video
                                ref={videoRef}
                                src={data.videoUrl}
                                className="w-full h-full object-contain"
                                playsInline
                                muted
                                autoPlay
                                loop
                                preload="auto"
                            />
                            <Tooltip title="Phát lại video">
                                <Button
                                    shape="circle"
                                    icon={<ReloadOutlined />}
                                    onClick={handleReplay}
                                    className="!absolute top-3 right-3 bg-white/80 hover:bg-white shadow-md transition-transform hover:scale-105"
                                />
                            </Tooltip>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-2">
                        <PlayCircleOutlined />
                        <span>
                            {data.gifUrl
                                ? "Ảnh GIF minh họa thứ tự nét viết"
                                : "Video minh họa thứ tự nét viết"}
                        </span>
                    </div>
                </div>
            </div>

            {/* ==== COMMENT ==== */}
            <Comment entityType="KANJI" entityId={data.id} />

            {/* ==== MODAL PHÂN TÍCH ==== */}
            <KanjiDecompositionModal
                open={analyzeOpen}
                onClose={() => setAnalyzeOpen(false)}
                kanji={data.characterName}
            />

            <SaveToDeckModal
                open={saveModalOpen}
                onClose={() => setSaveModalOpen(false)}
                kanjiId={data.id}
                defaultFrontText={data.characterName}
                defaultBackText={`${data.sinoViName || ""}: ${data.meaning || ""}`}
            />
        </div>
    );
}
