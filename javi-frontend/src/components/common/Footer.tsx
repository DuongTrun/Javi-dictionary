import { MdEmail, MdLocationOn, MdPhone } from "react-icons/md";
import zalo from "../../assets/zalo.png";
import facebook from "../../assets/facebook.png";
import safari from "../../assets/safari.png";
import chrome from "../../assets/chrome.png";
import firefox from "../../assets/firefox.png";
import blueJavi from "../../assets/blue-javi.png";
import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <div className="bg-white text-sm border border-gray-200 rounded-2xl shadow-sm mx-auto px-3 py-3">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 items-start text-left pb-4">
                {/* Cột 1: Thông tin */}
                <div>
                    <div className="flex items-center gap-2">
                        <img
                            src={blueJavi}
                            alt="Javi"
                            className="w-[120px] h-[60px] object-cover"
                        />
                        {/* <h2 className="text-xl font-semibold text-gray-800">
                            Javi
                        </h2> */}
                    </div>
                    <p className="text-gray-600 mt-1 mb-3">
                        Javi - giúp bạn học tiếng Nhật hiệu quả hơn mỗi ngày.
                    </p>
                    <ul className="space-y-2 text-gray-600 text-sm">
                        <li className="flex items-center gap-2">
                            <MdLocationOn className="text-blue-500 text-xl" />
                            <span>Ba Đình - Hà Nội - Việt Nam</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <MdEmail className="text-blue-500 text-xl" />
                            <span>nguyenduongtrung0803@gmail.com</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <MdPhone className="text-blue-500 text-xl" />
                            <span>(+84) 97 894 5022</span>
                        </li>
                    </ul>
                </div>
                {/* Cột 2: Kết nối */}
                <div>
                    <div>
                        {" "}
                        <h3 className="text-base my-[12px]">Mạng xã hội</h3>
                        <ul className="flex gap-4 mb-4">
                            <li>
                                <a
                                    href="https://www.facebook.com/trung.nguyenduong.5070"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img
                                        src={facebook}
                                        alt="FACEBOOK"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li>
                            {/* <li>
                                <a
                                    href="https://www.tiktok.com/@pantheon.ndh"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img
                                        src={tiktok}
                                        alt="TIKTOK"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li> */}
                            <li>
                                <a
                                    href="https://zalo.me/0978945022"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img
                                        src={zalo}
                                        alt="ZALO"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li>
                            {/* <li>
                                <a
                                    href="https://www.instagram.com/dhieu.ndh/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img
                                        src={instagram}
                                        alt="INSTAGRAM"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li> */}
                            {/* <li>
                                <a
                                    href="https://www.youtube.com/@duyhieunguyen3890"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img
                                        src={youtube}
                                        alt="YOUTUBE"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://m.me/duyhieu.nguyen.98434"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img
                                        src={messenger}
                                        alt="MESSENGER"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li> */}
                            {/* <li>
                                <a href="#" onClick={(e) => e.preventDefault()}>
                                    <img
                                        src={line}
                                        alt="LINE"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li> */}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-base my-[12px]">Tiện ích</h3>
                        <ul className="flex gap-4 mb-4">
                            <li>
                                <a href="#" onClick={(e) => e.preventDefault()}>
                                    <img
                                        src={chrome}
                                        alt="CHROME"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li>
                            <li>
                                <a href="#" onClick={(e) => e.preventDefault()}>
                                    <img
                                        src={safari}
                                        alt="SAFARI"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li>
                            <li>
                                <a href="#" onClick={(e) => e.preventDefault()}>
                                    <img
                                        src={firefox}
                                        alt="FIREFOX"
                                        className="w-[32px] h-[32px]"
                                    />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Cột 2: Liên kết nhanh */}
                <div>
                    <h3 className="text-base my-[12px]">Chức năng chính</h3>
                    <ul className="space-y-2 text-gray-600 text-sm">
                        <li>
                            <Link
                                className="hover:text-blue-600 transition"
                                to="/search"
                            >
                                Tra cứu
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/translate"
                                className="hover:text-blue-600 transition"
                            >
                                Dịch
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/jlpt"
                                className="hover:text-blue-600 transition"
                            >
                                Luyện thi JLPT
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/intro"
                                className="hover:text-blue-600 transition"
                            >
                                Giới thiệu
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="pt-4 border-t border-gray-200 flex flex-col items-center align-middle space-y-3">
                {/* <p>Bắt đầu thực hiện từ ngày 27-09-2025</p> */}
                <p>Copyright © 2025</p>
            </div>
        </div>
    );
}
