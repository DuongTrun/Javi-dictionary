import { useEffect, useRef } from "react";
import { List, Typography, Collapse } from "antd";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import avatarDefault from "@/assets/avatar.png";
import bg_1_month from "@/assets/bg-1-month.png";
import bg_3_month from "@/assets/bg-3-month.png";
import bg_6_month from "@/assets/bg-6-month.png";

const { Title, Text } = Typography;
const { Panel } = Collapse;

type Plan = {
    id: string;
    months: number;
    price: string;
    originalPrice?: string;
    highlight?: boolean;
    bgUrl?: string;
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
        bgUrl: bg_1_month,
        type: "Basic version",
    },
    {
        id: "p2",
        months: 6,
        price: "5.000",
        originalPrice: "719.000",
        highlight: true,
        bgUrl: bg_6_month,
        type: "Most Popular",
    },
    {
        id: "p3",
        months: 3,
        price: "319.000",
        bgUrl: bg_3_month,
        type: "Basic version",
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
        <div className="mt-10 px-2">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* left column */}
                <div className="lg:col-span-3">
                    <div className="w-full overflow-hidden">
                        <div className="w-[200px] md:w-[300px] h-[42px] mx-auto flex items-center justify-center text-center text-xl font-medium mb-5 rounded-full bg-[#f1f5fd] shadow-md text-[#3e67d6] border border-[#3e67d6]">
                            Javi Premium
                        </div>
                        <div
                            ref={scrollRef}
                            className="flex flex-nowrap lg:grid lg:grid-cols-3 justify-start lg:justify-center overflow-x-auto lg:overflow-x-visible overflow-y-hidden scroll-smooth snap-x snap-mandatory max-w-full scroll-x-thin"
                        >
                            {PLANS.map((plan) => {
                                const isHighlight = !!plan.highlight;
                                return (
                                    <div
                                        key={plan.id}
                                        className="min-w-[260px] snap-center"
                                        data-plan-id={plan.id}
                                        data-highlight={
                                            isHighlight ? "true" : undefined
                                        }
                                    >
                                        <div
                                            onClick={() => {
                                                // GỌI NAVIGATE SANG MÀN CONFIRM KHI NHẤN GÓI
                                                navigate("/premium/confirm", {
                                                    state: { plan },
                                                });
                                            }}
                                            className={`relative rounded-xl overflow-visible flex flex-col cursor-pointer font-normal`}
                                        >
                                            <div className="mx-auto rounded-lg overflow-hidden relative">
                                                <img
                                                    src={plan.bgUrl}
                                                    alt=""
                                                    className="object-cover block"
                                                />
                                                {isHighlight && (
                                                    <div className="text-center absolute top-2 left-0 w-full text-xl md:text-2xl font-bold text-white [text-shadow:0px_4px_4px_rgba(0,0,0,0.4),0px_8px_16px_rgba(0,0,0,0.3)]">
                                                        -30%
                                                    </div>
                                                )}
                                                <div
                                                    className={`text-center absolute left-0 w-full text-xl md:text-2xl font-semibold text-gray-700 font-system ${
                                                        isHighlight
                                                            ? "top-12"
                                                            : "top-6"
                                                    }`}
                                                >
                                                    {plan.months} Tháng
                                                </div>
                                                <div
                                                    className={`text-center absolute left-0 w-full text-lg md:text-xl font-normal font-medium ${
                                                        isHighlight
                                                            ? "text-[#ffa800] top-20"
                                                            : "text-[#3e67d6] top-14"
                                                    }`}
                                                >
                                                    {plan.type}
                                                </div>
                                                <div
                                                    className={`text-center absolute left-0 w-full text-2xl md:text-3xl font-semibold text-white ${
                                                        isHighlight
                                                            ? "[text-shadow:0px_4px_4px_rgba(0,0,0,0.4),0px_8px_16px_rgba(0,0,0,0.3)] bottom-20 md:bottom-24"
                                                            : "bottom-20"
                                                    }`}
                                                >
                                                    {plan.price}
                                                    <span className="underline align-super text-[14px] md:text-[18px] ml-1">
                                                        đ
                                                    </span>
                                                </div>
                                                {isHighlight && (
                                                    <div className="flex justify-center text-center absolute bottom-12 md:bottom-16 left-0 w-full text-xl md:text-2xl font-normal text-white line-through">
                                                        {plan.originalPrice}
                                                        <span className="underline text-[14px] md:text-[18px]">
                                                            đ
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-4 flex justify-center">
                        <div className="inline-flex items-center rounded-full overflow-hidden  h-[46px] sm:h-[52px] md:h-[59px]">
                            <div className="h-[46px] sm:h-[52px] md:h-[59px] flex items-center px-4 sm:px-5 font-normal text-white text-[14px] sm:text-[16px] md:text-[18px] border-r-2 border-white bg-[linear-gradient(94.87deg,#ffa800_9.03%,#d48806_97.19%)]">
                                Giảm 5%
                            </div>
                            <button
                                onClick={() =>
                                    window.open(
                                        "https://zalo.me/0976024780",
                                        "_blank"
                                    )
                                }
                                className="h-[46px] sm:h-[52px] md:h-[59px] flex items-center px-4 sm:px-6 font-normal text-white text-[14px] sm:text-[16px] md:text-[18px] border-none bg-[linear-gradient(90deg,#3e67d6,#2e439f)]"
                            >
                                Khi nhắn tin qua Zalo
                            </button>
                        </div>
                    </div>

                    {/* Người dùng nói gì (reviews) */}
                    <div className="mt-6 bg-white rounded-2xl py-4">
                        <div className="px-4 sm:px-6">
                            <div className="text-lg font-normal text-gray-800 mb-3">
                                Người dùng nói gì về Javi Premium
                            </div>
                            <div className="scroll-x-thin flex gap-4 overflow-x-auto overflow-y-hidden pb-4 snap-x snap-mandatory scroll-smooth">
                                {MOCK_REVIEWS.map((r) => (
                                    <div
                                        key={r.id}
                                        className="min-w-[260px] sm:min-w-[280px] md:min-w-[320px] snap-start bg-[#f1f5fd] rounded-2xl p-4"
                                    >
                                        <div className="flex items-start gap-3 mb-2">
                                            <img
                                                src={r.avatar}
                                                alt={r.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm font-normal text-gray-800">
                                                        {r.name}
                                                    </div>
                                                </div>
                                                <div className="mt-1 flex items-center gap-1">
                                                    {Array.from({
                                                        length: 5,
                                                    }).map((_, i) => (
                                                        <svg
                                                            key={i}
                                                            viewBox="0 0 20 20"
                                                            fill={
                                                                i < r.stars
                                                                    ? "#f6ad55"
                                                                    : "#e6e6e6"
                                                            }
                                                            className="w-4 h-4"
                                                            aria-hidden="true"
                                                        >
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.374 2.455a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.436 2.785c-.785.57-1.84-.197-1.54-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.572 9.384c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.957z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-700 meaning-clamp">
                                            {r.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* right column */}
                <div className="lg:col-span-1">
                    <div
                        id="benefits"
                        className="rounded-2xl bg-white shadow-sm p-4 font-normal"
                    >
                        <Title level={5} className="mb-2 !font-normal">
                            Quyền lợi
                        </Title>
                        <List
                            dataSource={BENEFITS}
                            renderItem={(item) => (
                                <List.Item className="py-1">
                                    <List.Item.Meta
                                        avatar={
                                            <span
                                                className="inline-flex items-center justify-center w-5 h-5 rounded-full"
                                                style={{
                                                    background: "#fff7ed",
                                                }}
                                            >
                                                <IoIosCheckmarkCircle
                                                    size={14}
                                                    color="#f59e0b"
                                                />
                                            </span>
                                        }
                                        title={
                                            <Text className="text-sm">
                                                {item}
                                            </Text>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </div>

                    <div className="h-4" />

                    <div className="rounded-2xl bg-white shadow-sm p-4 font-normal">
                        <Title level={5} className="mb-2 !font-normal">
                            Câu hỏi thường gặp
                        </Title>
                        <Collapse
                            bordered={false}
                            ghost
                            className="faq-collapse"
                        >
                            <Panel
                                className="pb-4"
                                header="Sau khi đăng ký Javi premium, tôi sẽ có những quyền lợi gì?"
                                key="1"
                            >
                                <Text
                                    type="secondary"
                                    className="text-sm font-normal font-system italic"
                                >
                                    Sau khi nâng cấp từ điển Javi bạn sẽ được bỏ
                                    hoàn toàn quảng cáo và sử dụng tất cả tính
                                    năng bị giới hạn trên app (Bao gồm cả các
                                    tính năng mới cập nhật trong tương lai). Để
                                    thêm thông tin chi tiết, hãy liên hệ với Tư
                                    vấn viên của Javi qua Hotline: 0976024780.
                                </Text>
                            </Panel>
                            <Panel
                                className="pb-4"
                                header="Làm sao để biết các chương trình ưu đãi của Javi?"
                                key="2"
                            >
                                <Text
                                    type="secondary"
                                    className="text-sm font-normal font-system italic"
                                >
                                    Về chương trình ưu đãi, Bạn có thể theo dõi
                                    trên các kênh truyền thông của Javi như:
                                    Trang cá nhân của admin Duy Hiếu , Thông báo
                                    trên Web,...
                                </Text>
                            </Panel>
                            <Panel
                                className="pb-4"
                                header="Với 01 tài khoản Javi Premium tôi có được dùng chung cho nhiều thiết bị không?"
                                key="3"
                            >
                                <Text
                                    type="secondary"
                                    className="text-sm font-normal font-system italic"
                                >
                                    Chỉ với 01 tài khoản, bạn có thể đồng bộ
                                    trên 3 thiết bị Web, Android, IOS rất tiện
                                    lợi và tiết kiệm chi phí. Bạn cũng sẽ không
                                    cần phải lo khi đổi thiết bị, tài khoản vẫn
                                    được đồng bộ.
                                </Text>
                            </Panel>
                            <Panel
                                className=""
                                header="Tôi ở Nhật, tôi có thể mua Javi Premium không?"
                                key="4"
                            >
                                <Text
                                    type="secondary"
                                    className="text-sm font-normal font-system italic"
                                >
                                    Có. Liên hệ Zalo để được hướng dẫn cách
                                    thanh toán quốc tế hoặc chuyển khoản. Tại
                                    Nhật, bạn vẫn có thể mua Javi Premium dễ
                                    dàng. Javi có hỗ trợ hệ thống thanh toán
                                    trên app hoặc chuyển khoản (Áp dụng đồng
                                    thời cho cả Việt Nam và Nhật Bản). Bạn vui
                                    lòng làm theo hướng dẫn sau khi đăng ký mua
                                    hàng hoặc liên hệ tư vấn viên để được hỗ trợ
                                    thêm.
                                </Text>
                            </Panel>
                        </Collapse>
                    </div>
                </div>
            </div>
        </div>
    );
}
