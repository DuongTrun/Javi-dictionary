import { useRef, useState, useEffect } from "react";
import { Modal, Button } from "antd";
import { Link } from "react-router-dom";
import { CiGift } from "react-icons/ci";
import { FaLightbulb } from "react-icons/fa";
import confetti from "canvas-confetti";

type IntroModalProps = {
    open: boolean;
    onClose: () => void;
    storageKey?: string;
};

export default function IntroModal({
    open,
    onClose,
    storageKey = "javi_seen_intro_v1",
}: IntroModalProps) {
    const [hintOpen, setHintOpen] = useState(false);

    // ref tới overlay container trong modal — canvas confetti sẽ được append vào đây
    const overlayRef = useRef<HTMLDivElement | null>(null);
    // lưu instance confetti (bound to canvas) để có thể tái dùng / dọn dẹp
    const confettiInstanceRef = useRef<((opts: any) => void) | null>(null);
    // lưu canvas hiện tại để dọn dẹp sau
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        // Khi modal đóng (open=false) — nếu có canvas confetti chưa dọn, dọn luôn
        if (!open) {
            cleanupCanvas();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        // cleanup khi component unmount
        return () => {
            cleanupCanvas();
        };
    }, []);

    const cleanupCanvas = () => {
        // hủy instance và xóa canvas khỏi DOM
        try {
            confettiInstanceRef.current = null;
            if (canvasRef.current && canvasRef.current.parentNode) {
                canvasRef.current.parentNode.removeChild(canvasRef.current);
            }
        } catch (e) {
            // ignore
        } finally {
            canvasRef.current = null;
        }
    };

    const acknowledgeAndClose = () => {
        try {
            localStorage.setItem(storageKey, "1");
        } catch (e) {}
        onClose();
    };

    /**
     * Tạo canvas overlay trong overlayRef và trả về instance confetti bound to that canvas.
     * Nếu đã tồn tại canvas trước đó thì trả về instance hiện có.
     */
    const ensureConfettiInstance = () => {
        if (confettiInstanceRef.current) return confettiInstanceRef.current;

        const container = overlayRef.current;
        if (!container) {
            // fallback: nếu không tìm thấy overlay (lý thuyết không xảy ra), dùng global confetti
            confettiInstanceRef.current = confetti;
            return confettiInstanceRef.current;
        }

        // tạo canvas và append vào container
        const canvas = document.createElement("canvas");
        canvas.style.position = "absolute";
        canvas.style.left = "0";
        canvas.style.top = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.pointerEvents = "none"; // không chặn tương tác
        // đảm bảo z-index cao hơn nội dung modal (nếu cần tăng thêm)
        canvas.style.zIndex = "9999";

        // append và bind
        container.appendChild(canvas);
        canvasRef.current = canvas;

        const myConfetti = confetti.create(canvas, {
            resize: true,
            useWorker: true,
        });
        confettiInstanceRef.current = myConfetti;

        return myConfetti;
    };

    /** gọi khi mở hint -> bật hint + bắn confetti trên canvas nằm **trước** modal */
    const handleOpenHint = () => {
        setHintOpen(true);

        const myConfetti = ensureConfettiInstance();

        // burst chính
        myConfetti({
            particleCount: 180,
            spread: 180,
            startVelocity: 40,
            ticks: 200,
            origin: { x: 0.5, y: 0.35 },
            colors: [
                "#60A5FA",
                "#3B82F6",
                "#34D399",
                "#10B981",
                "#FBBF24",
                "#FCD34D",
                "#F97316",
                "#FB7185",
                "#EC4899",
                "#F43F5E",
            ],
        });

        // dọn canvas sau animation xong: tùy chọn 2s
        setTimeout(() => {
            // dọn sạch DOM canvas để tránh tồn tại mãi
            cleanupCanvas();
        }, 2000);

        // thêm 1 burst phụ để tạo chiều sâu
        setTimeout(() => {
            myConfetti({
                particleCount: 80,
                spread: 100,
                startVelocity: 30,
                ticks: 220,
                origin: { x: 0.5, y: 0.4 },
                colors: [
                    "#60A5FA",
                    "#3B82F6",
                    "#34D399",
                    "#10B981",
                    "#FBBF24",
                    "#FCD34D",
                    "#F97316",
                    "#FB7185",
                    "#EC4899",
                    "#F43F5E",
                ],
            });
        }, 100);

        // dọn canvas sau animation xong: tùy chọn 2s
        setTimeout(() => {
            // dọn sạch DOM canvas để tránh tồn tại mãi
            cleanupCanvas();
        }, 2000);
    };

    return (
        <Modal
            open={open}
            centered
            onCancel={onClose}
            footer={null}
            width={580}
            maskClosable
            className="with-padding-modal"
            bodyStyle={{ padding: 0, borderRadius: 12 }}
        >
            {/* ===== HEADER (giữ nguyên) ===== */}
            <div className="mb-4">
                <div className="flex flex-col">
                    <h1
                        className="m-0 text-[#0F3FBF] text-3xl md:text-3xl font-extrabold tracking-tight leading-tight"
                        style={{ lineHeight: 1.05 }}
                    >
                        Javi
                    </h1>

                    <div className="mt-1">
                        <span className="text-sm text-gray-600 font-medium">
                            Học tiếng Nhật cùng bạn
                        </span>
                    </div>
                </div>
            </div>

            {/* ===== CONTENT ===== */}
            <div className="">
                {/* overlay container: canvas-confetti sẽ append vào đây để hiện trước modal content */}
                <div
                    ref={overlayRef}
                    // overlay nằm trong vùng nội dung của modal, position absolute phủ toàn phần vùng 'p-6'
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        zIndex: 9999, // cao hơn modal nội dung
                    }}
                />

                <div className="relative">
                    <p className="text-gray-700 leading-relaxed mb-5 text-[15px]">
                        Đây là dự án demo của mình. Hiện tại dữ liệu từ
                        điển được phát triển ở mức{" "}
                        <strong className="text-indigo-600">JLPT N5</strong>,
                        nên một số từ hoặc cấu trúc cao hơn có thể chưa có trong
                        hệ thống. Chức năng dịch bạn vẫn có thể dùng bình
                        thường.
                    </p>

                    {/* ===== Hint / Quà tặng Premium ===== */}
                    <div className="mb-5">
                        {!hintOpen && (
                            <button
                                onClick={handleOpenHint} // 🎉 bắn confetti ở đây
                                className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow transition text-left relative overflow-hidden"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg">
                                        <CiGift className="text-2xl" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-800">
                                            Ưu đãi khai trương
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Nhấn để xem quà tặng của bạn
                                        </div>
                                    </div>
                                </div>
                                <div className="text-indigo-500 text-sm">
                                    Mở
                                </div>
                            </button>
                        )}

                        {hintOpen && (
                            <div className="w-full bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <CiGift className="text-2xl" />
                                    </div>

                                    <div className="flex-1">
                                        <div className="font-medium text-gray-800">
                                            Quà khai trương — dùng thử 1 tháng
                                            Premium
                                        </div>

                                        <p className="text-sm text-gray-600 mt-1">
                                            Nhân dịp ra mắt, Javi tặng bạn{" "}
                                            <strong>
                                                1 tháng Premium miễn phí
                                            </strong>{" "}
                                            để trải nghiệm toàn bộ tính năng.
                                            Bạn vui lòng nhắn tin cho Javi qua
                                            Zalo nhé.
                                        </p>

                                        <button
                                            onClick={() => setHintOpen(false)}
                                            className="mt-3 text-xs text-indigo-600 underline"
                                        >
                                            Thu gọn
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ===== Note ===== */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-5 border border-gray-100">
                        <p className="text-xs text-gray-600 m-0 flex items-start gap-2">
                            <FaLightbulb className="text-yellow-500 shrink-0 text-base" />
                            <span>
                                Thông báo này sẽ chỉ ẩn khi bạn bấm{" "}
                                <strong>&ldquo;Đã hiểu&rdquo;</strong>. Bạn có
                                thể xem lại thông tin tại trang giới thiệu bất
                                kỳ lúc nào.
                            </span>
                        </p>
                    </div>

                    {/* ===== Footer ===== */}
                    <div className="flex gap-3">
                        <Link
                            to="/intro"
                            onClick={acknowledgeAndClose}
                            className="flex-1"
                        >
                            <Button
                                size="large"
                                className="w-full flex items-center justify-center gap-2"
                            >
                                <span>Xem chi tiết dự án</span>
                            </Button>
                        </Link>

                        <Button
                            type="primary"
                            size="large"
                            onClick={acknowledgeAndClose}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                        >
                            Đã hiểu
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
