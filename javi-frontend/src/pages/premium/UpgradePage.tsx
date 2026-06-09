import { useEffect, useRef } from "react";
import { List, Typography, Collapse } from "antd";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import avatarDefault from "@/assets/avatar.png";

const { Text } = Typography;
const { Panel } = Collapse;

type Plan = {
    id: string;
    months: number;
    price: string;
    originalPrice?: string;
    highlight?: boolean;
    type?: string;
};

const MOCK_REVIEWS = [
    {
        id: "r1",
        name: "Nguyễn Minh Hoàng",
        avatar: avatarDefault,
        stars: 5,
        text: "Ứng dụng học rất hiệu quả, đặc biệt là phần tra cứu nhanh và dịch bằng AI. Rất tiện cho người mới bắt đầu.",
    },
    {
        id: "r2",
        name: "Trần Thu Hà",
        avatar: avatarDefault,
        stars: 4,
        text: "App sử dụng rất ổn, kho từ vựng và ngữ pháp đồ sộ. Mình dùng mỗi ngày để luyện thi JLPT, cực kỳ hài lòng.",
    },
    {
        id: "r3",
        name: "Lê Phương Linh",
        avatar: avatarDefault,
        stars: 5,
        text: "Rất tốt luôn ạ, một ứng dụng không thể thiếu với người học tiếng Nhật. Chúc Javi phát triển mạnh hơn nữa!",
    },
    {
        id: "r4",
        name: "Phạm Quốc Khánh",
        avatar: avatarDefault,
        stars: 4,
        text: "Tính năng phân tích câu siêu hữu ích. Mong team cải thiện thêm tốc độ load, còn lại đều quá tuyệt.",
    },
    {
        id: "r5",
        name: "Hoàng Đức Thịnh",
        avatar: avatarDefault,
        stars: 5,
        text: "Dùng Premium thấy xứng đáng thật sự. Tra từ nhanh, chính xác, lại không có quảng cáo làm phiền.",
    },
    {
        id: "r6",
        name: "Nguyễn Thanh Tâm",
        avatar: avatarDefault,
        stars: 5,
        text: "Mình thích nhất là tính năng dịch ảnh! Chụp menu, tài liệu đều nhận rất tốt, tiện lắm luôn.",
    },
    {
        id: "r7",
        name: "Yamada Kenji",
        avatar: avatarDefault,
        stars: 5,
        text: "毎日使っています。とても便利で、勉強が続けやすいアプリです。おすすめします！",
    },
    {
        id: "r8",
        name: "Sato Haruka",
        avatar: avatarDefault,
        stars: 4,
        text: "UI đẹp, dễ dùng。日本語の勉強にとても役に立ちます。愛用しています。",
    },
    {
        id: "r9",
        name: "Michael Nguyen",
        avatar: avatarDefault,
        stars: 4,
        text: "Good app for JLPT learners. The grammar explanations are very clear and easy to understand.",
    },
    {
        id: "r10",
        name: "Anna Trần",
        avatar: avatarDefault,
        stars: 5,
        text: "Tính năng luyện đọc và tra Kanji giúp mình tiến bộ nhanh. Cảm ơn team rất nhiều!",
    },
    {
        id: "r11",
        name: "Đỗ Hải Đăng",
        avatar: avatarDefault,
        stars: 5,
        text: "App này xứng đáng nằm trong top ứng dụng học tiếng Nhật. Mình đã giới thiệu cho rất nhiều bạn bè.",
    },
    {
        id: "r12",
        name: "Vũ Minh Vy",
        avatar: avatarDefault,
        stars: 5,
        text: "Rất hài lòng! Giao diện mượt, nội dung phong phú. Dùng Premium đúng là khác biệt hoàn toàn.",
    },
];

const PLANS: Plan[] = [
    {
        id: "p1",
        months: 1,
        price: "119.000",
        type: "Gói cơ bản",
    },
    {
        id: "p2",
        months: 6,
        price: "499.000",
        originalPrice: "719.000",
        highlight: true,
        type: "Phổ biến nhất",
    },
    {
        id: "p3",
        months: 3,
        price: "319.000",
        type: "Tiết kiệm",
    },
];

const BENEFITS = [
    "Không quảng cáo",
    "Không giới hạn số lần dịch bằng hình ảnh trên ngày",
    "Không giới hạn số lần dịch bằng hình ảnh, văn bản với AI trên ngày",
    "Giải thích từ vựng nâng cao",
    "Phân tích hán tự chi tiết",
    "Đồng bộ dữ liệu trên mọi thiết bị",
    "Truy cập toàn bộ bài luyện JLPT & nội dung nâng cao",
    "Hỗ trợ ưu tiên khi cần trợ giúp",
];

export default function UpgradePage(): JSX.Element {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();

    // Auto-center: chính xác theo offsetLeft của phần tử highlight (hoạt động trên mobile)
    useEffect(() => {
        // Chờ tất cả <img> trong container load xong (hoặc timeout fallback)
        const waitImagesLoaded = (
            container: HTMLElement,
            timeout = 600
        ): Promise<void> => {
            return new Promise<void>((resolve) => {
                const imgs = Array.from(
                    container.querySelectorAll("img")
                ) as HTMLImageElement[];
                if (imgs.length === 0) {
                    resolve();
                    return;
                }

                let remaining = imgs.length;
                let finished = false;

                const tryResolve = () => {
                    if (finished) return;
                    remaining--;
                    if (remaining <= 0) {
                        finished = true;
                        resolve();
                    }
                };

                const timers: number[] = [];

                imgs.forEach((img) => {
                    if (img.complete) {
                        tryResolve();
                    } else {
                        const onLoadOrError = () => {
                            img.removeEventListener("load", onLoadOrError);
                            img.removeEventListener("error", onLoadOrError);
                            tryResolve();
                        };
                        img.addEventListener("load", onLoadOrError);
                        img.addEventListener("error", onLoadOrError);

                        // Timeout riêng cho mỗi ảnh để tránh treo forever
                        const t = window.setTimeout(() => {
                            img.removeEventListener("load", onLoadOrError);
                            img.removeEventListener("error", onLoadOrError);
                            tryResolve();
                        }, timeout);
                        timers.push(t);
                    }
                });

                // Cleanup timers nếu resolve trước khi timeout hết
                const origResolve = resolve;
                (resolve as any) = (...args: any[]) => {
                    timers.forEach((t) => clearTimeout(t));
                    origResolve(...args);
                };
            });
        };

        const runCenterOnce = async () => {
            const container = scrollRef.current;
            if (!container) return;

            // chỉ canh center trên mobile (width < 1024)
            const isMobile = window.innerWidth < 1024;
            if (!isMobile) {
                container.scrollLeft = 0;
                return;
            }

            // chờ ảnh load xong (hoặc timeout 600ms) để offsetLeft chính xác
            await waitImagesLoaded(container, 600);

            // chờ 1 frame để layout ổn định
            await new Promise<void>((resolve) =>
                requestAnimationFrame(() => resolve())
            );

            const highlighted = container.querySelector(
                '[data-highlight="true"]'
            ) as HTMLElement | null;
            const first = container.querySelector(
                "[data-plan-id]"
            ) as HTMLElement | null;
            const target = highlighted ?? first;
            if (!target) return;

            const containerWidth = container.clientWidth;
            const targetWidth = target.clientWidth;
            const left =
                target.offsetLeft - (containerWidth / 2 - targetWidth / 2);
            const maxScroll = container.scrollWidth - containerWidth;
            const to = Math.max(0, Math.min(left, maxScroll));

            // delay ngắn để tránh xung đột với transition
            setTimeout(() => {
                container.scrollTo({ left: to, behavior: "smooth" });
            }, 40);
        };

        runCenterOnce();
        const onResize = () => runCenterOnce();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return (
        <div className="mt-6 sm:mt-10 px-3 sm:px-4 overflow-x-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-6">
                {/* left column */}
                <div className="lg:col-span-3">
                    <div className="w-full">
                        <div className="w-[160px] sm:w-[180px] md:w-[260px] h-[36px] sm:h-[40px] mx-auto flex items-center justify-center text-center text-xs sm:text-sm font-semibold mb-6 sm:mb-8 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm uppercase tracking-wider">
                            <span className="material-symbols-outlined text-sm mr-1.5 icon-fill">workspace_premium</span> Javi Premium
                        </div>
                        <div
                            ref={scrollRef}
                            className="flex flex-nowrap lg:grid lg:grid-cols-3 justify-start lg:justify-center items-stretch gap-4 sm:gap-6 overflow-x-auto lg:overflow-x-visible overflow-y-hidden pb-4 sm:pb-6 snap-x snap-mandatory max-w-full scroll-x-thin"
                        >
                            {PLANS.map((plan) => {
                                const isHighlight = !!plan.highlight;
                                return (
                                    <div
                                        key={plan.id}
                                        className="min-w-[285px] sm:min-w-[290px] lg:min-w-0 snap-center p-1"
                                        data-plan-id={plan.id}
                                        data-highlight={
                                            isHighlight ? "true" : undefined
                                        }
                                    >
                                        <div
                                            onClick={() => {
                                                navigate("/premium/confirm", {
                                                    state: { plan },
                                                });
                                            }}
                                            className={`relative rounded-3xl p-5 sm:p-6 flex flex-col justify-between cursor-pointer h-full min-h-[300px] sm:min-h-[320px] transition-premium select-none border ${
                                                isHighlight
                                                    ? "bg-gradient-to-br from-primary to-surface-tint border-primary/10 text-white shadow-lg sm:scale-[1.02] lg:scale-[1.04] hover:scale-[1.02] sm:hover:scale-[1.04] lg:hover:scale-[1.06]"
                                                    : "bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:border-primary hover:shadow-md hover:-translate-y-0.5"
                                            }`}
                                        >
                                            {/* Top Section */}
                                            <div>
                                                <div className="flex justify-between items-center w-full mb-5">
                                                    <span className={`text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                                        isHighlight
                                                            ? "bg-white/20 backdrop-blur-md text-white border border-white/20"
                                                            : "bg-primary-container/10 text-primary-fixed-variant"
                                                    }`}>
                                                        {plan.type}
                                                    </span>
                                                    {isHighlight && (
                                                        <span className="bg-white text-rose-600 text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
                                                            -30%
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${
                                                    isHighlight ? "text-white" : "text-on-surface"
                                                }`}>
                                                    {plan.months} Tháng
                                                </h3>
                                            </div>

                                            {/* Price Section */}
                                            <div className="my-4 sm:my-8">
                                                {isHighlight && plan.originalPrice && (
                                                    <div className="text-[13px] text-white/70 line-through mb-1.5 font-medium">
                                                        {plan.originalPrice}đ
                                                    </div>
                                                )}
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-3xl sm:text-4xl font-black ${
                                                        isHighlight ? "text-white" : "text-on-surface"
                                                    }`}>
                                                        {plan.price}
                                                    </span>
                                                    <span className={`text-lg font-bold ${
                                                        isHighlight ? "text-white/90" : "text-on-surface-variant"
                                                    }`}>
                                                        đ
                                                    </span>
                                                    <span className={`text-[13px] ml-1.5 ${
                                                        isHighlight ? "text-white/70" : "text-on-surface-variant"
                                                    }`}>
                                                        / gói
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Button CTA */}
                                            <button className={`w-full py-3 rounded-full font-bold text-xs tracking-wider uppercase transition-all duration-300 transform active:scale-95 ${
                                                isHighlight
                                                    ? "bg-white text-primary hover:bg-slate-50 hover:shadow-md"
                                                    : "bg-surface border border-outline-variant/30 hover:bg-primary/5 hover:border-primary/50 text-on-surface shadow-sm"
                                            }`}>
                                                Đăng ký ngay
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Người dùng nói gì (reviews) */}
                    <div className="mt-6 sm:mt-8 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-4 sm:p-6 shadow-sm overflow-hidden">
                        <div className="px-0 sm:px-1">
                            <h3 className="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
                                💬 Người dùng nói gì về Javi Premium
                            </h3>
                            <div className="scroll-x-thin flex gap-3 sm:gap-4 overflow-x-auto overflow-y-hidden pb-4 snap-x snap-mandatory scroll-smooth -mx-1">
                                {MOCK_REVIEWS.map((r) => (
                                    <div
                                        key={r.id}
                                        className="min-w-[220px] sm:min-w-[280px] md:min-w-[320px] snap-start bg-surface-container-low border border-outline-variant/10 rounded-2xl p-3 sm:p-4 hover:shadow-sm transition-all duration-300"
                                    >
                                        <div className="flex items-start gap-3 mb-2.5">
                                            <img
                                                src={r.avatar}
                                                alt={r.name}
                                                className="w-9 h-9 rounded-full object-cover border border-outline-variant/20 shadow-sm"
                                            />
                                            <div className="flex-1">
                                                <div className="text-[13px] font-bold text-on-surface">
                                                    {r.name}
                                                </div>
                                                <div className="mt-0.5 flex items-center gap-0.5">
                                                    {Array.from({
                                                        length: 5,
                                                    }).map((_, i) => (
                                                        <svg
                                                            key={i}
                                                            viewBox="0 0 20 20"
                                                            fill={
                                                                i < r.stars
                                                                    ? "#ffa800"
                                                                    : "#e2e8f0"
                                                            }
                                                            className="w-3.5 h-3.5"
                                                            aria-hidden="true"
                                                        >
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.374 2.455a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.436 2.785c-.785.57-1.84-.197-1.54-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.572 9.384c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.957z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-[13px] text-on-surface-variant leading-relaxed meaning-clamp">
                                            {r.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* right column */}
                <div className="lg:col-span-1 flex flex-col gap-5 sm:gap-6">
                    <div
                        id="benefits"
                        className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-4 sm:p-5 shadow-sm"
                    >
                        <h4 className="text-base font-bold text-on-surface mb-4 flex items-center gap-2 border-b border-outline-variant/10 pb-2">
                            ✨ Quyền lợi Premium
                        </h4>
                        <List
                            dataSource={BENEFITS}
                            renderItem={(item) => (
                                <List.Item className="py-2 border-none">
                                    <List.Item.Meta
                                        avatar={
                                            <span
                                                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary"
                                            >
                                                <IoIosCheckmarkCircle
                                                    size={15}
                                                />
                                            </span>
                                        }
                                        title={
                                            <span className="text-[13px] font-medium text-on-surface">
                                                {item}
                                            </span>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </div>

                    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-4 sm:p-5 shadow-sm">
                        <h4 className="text-base font-bold text-on-surface mb-4 flex items-center gap-2 border-b border-outline-variant/10 pb-2">
                            ❓ Câu hỏi thường gặp
                        </h4>
                        <Collapse
                            bordered={false}
                            ghost
                            className="faq-collapse"
                        >
                            <Panel
                                className="pb-3.5 border-b border-outline-variant/10 last:border-none last:pb-0"
                                header={<span className="text-[13px] font-bold text-on-surface">Sau khi đăng ký Javi premium, tôi có quyền lợi gì?</span>}
                                key="1"
                            >
                                <Text
                                    type="secondary"
                                    className="text-[12px] font-medium leading-relaxed font-system italic text-on-surface-variant"
                                >
                                    Sau khi nâng cấp từ điển Javi bạn sẽ được bỏ
                                    hoàn toàn quảng cáo và sử dụng tất cả tính
                                    năng bị giới hạn trên app (Bao gồm cả các
                                    tính năng mới cập nhật trong tương lai). Để
                                    thêm thông tin chi tiết, hãy liên hệ với Tư
                                    vấn viên của Javi qua Hotline: 0978945022.
                                </Text>
                            </Panel>
                            <Panel
                                className="pb-3.5 border-b border-outline-variant/10 last:border-none last:pb-0"
                                header={<span className="text-[13px] font-bold text-on-surface">Làm sao để biết các ưu đãi của Javi?</span>}
                                key="2"
                            >
                                <Text
                                    type="secondary"
                                    className="text-[12px] font-medium leading-relaxed font-system italic text-on-surface-variant"
                                >
                                    Về chương trình ưu đãi, Bạn có thể theo dõi
                                    trên các kênh truyền thông của Javi như:
                                    Trang cá nhân của admin Dương Trung , Thông báo
                                    trên Web,...
                                </Text>
                            </Panel>
                            <Panel
                                className="pb-3.5 border-b border-outline-variant/10 last:border-none last:pb-0"
                                header={<span className="text-[13px] font-bold text-on-surface">Gói Premium dùng chung nhiều thiết bị không?</span>}
                                key="3"
                            >
                                <Text
                                    type="secondary"
                                    className="text-[12px] font-medium leading-relaxed font-system italic text-on-surface-variant"
                                >
                                    Chỉ với 01 tài khoản, bạn có thể đồng bộ
                                    trên 3 thiết bị Web, Android, IOS rất tiện
                                    lợi và tiết kiệm chi phí. Bạn cũng sẽ không
                                    cần phải lo khi đổi thiết bị, tài khoản vẫn
                                    được đồng bộ.
                                </Text>
                            </Panel>
                            <Panel
                                className="last:pb-0"
                                header={<span className="text-[13px] font-bold text-on-surface">Tôi ở Nhật có mua Javi Premium được không?</span>}
                                key="4"
                            >
                                <Text
                                    type="secondary"
                                    className="text-[12px] font-medium leading-relaxed font-system italic text-on-surface-variant"
                                >
                                    Có. Liên hệ Zalo để được hướng dẫn cách
                                    thanh toán quốc tế hoặc chuyển khoản. Tại
                                    Nhật, bạn vẫn có thể mua Javi Premium dễ
                                    dàng. Javi có hỗ trợ hệ thống thanh toán
                                    trên app hoặc chuyển khoản để tiện cho bạn.
                                </Text>
                            </Panel>
                        </Collapse>
                    </div>
                </div>
            </div>
        </div>
    );
}
