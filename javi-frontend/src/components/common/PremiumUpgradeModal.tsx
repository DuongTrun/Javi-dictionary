import { Modal } from "antd";
import { useNavigate } from "react-router-dom";
import { usePremiumModalStore } from "@/stores/usePremiumModalStore";
import { PiCrownSimpleFill, PiCheckBold } from "react-icons/pi";

export default function PremiumUpgradeModal() {
  const { isOpen, closeModal } = usePremiumModalStore();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    closeModal();
    navigate("/premium");
  };

  return (
    <Modal
      open={isOpen}
      onCancel={closeModal}
      footer={null}
      centered
      width={460}
      styles={{
        body: { padding: 0 },
        content: {
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          padding: 0,
        },
      }}
      closeIcon={<span className="text-white hover:text-gray-200 text-lg">×</span>}
    >
      <div className="relative overflow-hidden font-sans">
        {/* Header với Background Gradient Violet-Gold và Crown icon */}
        <div className="bg-gradient-to-r from-[#5b21b6] via-[#7c3aed] to-[#d97706] text-white p-8 text-center relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-full mb-4 animate-bounce">
            <PiCrownSimpleFill className="w-8 h-8 text-[#f59e0b]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            Đạt Hạn Mức Sử Dụng AI!
          </h2>
          <p className="text-sm text-purple-100 max-w-sm mx-auto">
            Hôm nay bạn đã dùng hết 5 lượt AI miễn phí. Hãy nâng cấp lên Premium để trải nghiệm không giới hạn!
          </p>
        </div>

        {/* Quyền lợi của tài khoản Premium */}
        <div className="p-6 bg-white">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Đặc quyền Javi Premium
          </h3>
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                <PiCheckBold className="w-3 h-3 text-[#7c3aed]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Dịch thuật AI không giới hạn</h4>
                <p className="text-xs text-gray-500">Dịch văn bản, dịch ảnh chụp bằng camera siêu tốc và tự nhiên.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                <PiCheckBold className="w-3 h-3 text-[#7c3aed]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Giải thích từ & Kanji chuyên sâu</h4>
                <p className="text-xs text-gray-500">Phân tích chi tiết cấu tạo chữ Kanji và giải nghĩa từ vựng 24/7.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                <PiCheckBold className="w-3 h-3 text-[#7c3aed]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Giáo viên AI sửa ngữ pháp</h4>
                <p className="text-xs text-gray-500">Kiểm tra và giải thích chi tiết vì sao sai, đề xuất câu tự nhiên.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                <PiCheckBold className="w-3 h-3 text-[#7c3aed]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Luyện Kaiwa & Sửa phát âm</h4>
                <p className="text-xs text-gray-500">Giao tiếp trực tiếp với AI Coach, chấm điểm và chỉ ra lỗi phát âm.</p>
              </div>
            </div>
          </div>

          {/* Nút CTA nâng cấp */}
          <button
            onClick={handleUpgrade}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#7c3aed] to-[#db2777] hover:from-[#6d28d9] hover:to-[#be185d] text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all duration-300 transform active:scale-[0.98] focus:outline-none flex items-center justify-center gap-2 cursor-pointer"
          >
            <PiCrownSimpleFill className="w-5 h-5 text-yellow-300 animate-pulse" />
            Nâng cấp Premium ngay
          </button>

          <button
            onClick={closeModal}
            className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            Để sau
          </button>
        </div>
      </div>
    </Modal>
  );
}
