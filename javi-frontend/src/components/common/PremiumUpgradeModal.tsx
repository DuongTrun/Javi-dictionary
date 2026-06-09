import { Modal } from "antd";
import { useNavigate } from "react-router-dom";
import { usePremiumModalStore } from "@/stores/usePremiumModalStore";

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
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          padding: 0,
        },
      }}
      closeIcon={<span className="text-white hover:text-gray-200 text-lg">×</span>}
    >
      <div className="relative overflow-hidden font-sans">
        {/* Header với Background Gradient và Crown icon */}
        <div className="bg-gradient-to-r from-primary to-surface-tint text-white p-8 text-center relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-full mb-4 animate-bounce">
            <span className="material-symbols-outlined text-[32px] text-white icon-fill">workspace_premium</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            Đạt Hạn Mức Sử Dụng AI!
          </h2>
          <p className="text-sm text-purple-100 max-w-sm mx-auto">
            Hôm nay bạn đã dùng hết 5 lượt AI miễn phí. Hãy nâng cấp lên Premium để trải nghiệm không giới hạn!
          </p>
        </div>

        {/* Quyền lợi của tài khoản Premium */}
        <div className="p-6 bg-surface-container-lowest">
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4">
            Đặc quyền Javi Premium
          </h3>
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-container/20 flex items-center justify-center mt-0.5">
                <span className="material-symbols-outlined text-xs text-primary font-bold">check</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-on-surface">Dịch thuật AI không giới hạn</h4>
                <p className="text-xs text-on-surface-variant">Dịch văn bản, dịch ảnh chụp bằng camera siêu tốc và tự nhiên.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-container/20 flex items-center justify-center mt-0.5">
                <span className="material-symbols-outlined text-xs text-primary font-bold">check</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-on-surface">Giải thích từ & Kanji chuyên sâu</h4>
                <p className="text-xs text-on-surface-variant">Phân tích chi tiết cấu tạo chữ Kanji và giải nghĩa từ vựng 24/7.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-container/20 flex items-center justify-center mt-0.5">
                <span className="material-symbols-outlined text-xs text-primary font-bold">check</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-on-surface">Giáo viên AI sửa ngữ pháp</h4>
                <p className="text-xs text-on-surface-variant">Kiểm tra và giải thích chi tiết vì sao sai, đề xuất câu tự nhiên.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-container/20 flex items-center justify-center mt-0.5">
                <span className="material-symbols-outlined text-xs text-primary font-bold">check</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-on-surface">Luyện Kaiwa & Sửa phát âm</h4>
                <p className="text-xs text-on-surface-variant">Giao tiếp trực tiếp với AI Coach, chấm điểm và chỉ ra lỗi phát âm.</p>
              </div>
            </div>
          </div>

          {/* Nút CTA nâng cấp */}
          <button
            onClick={handleUpgrade}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary to-surface-tint hover:opacity-95 text-white font-bold rounded-full shadow-md transition-all duration-300 transform active:scale-[0.98] focus:outline-none flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg text-white icon-fill animate-pulse">workspace_premium</span>
            Nâng cấp Premium ngay
          </button>

          <button
            onClick={closeModal}
            className="w-full mt-3 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            Để sau
          </button>
        </div>
      </div>
    </Modal>
  );
}
