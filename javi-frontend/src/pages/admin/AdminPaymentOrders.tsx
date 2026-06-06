import { useEffect, useState } from "react";
import {
    Table,
    Tag,
    Button,
    Modal,
    Input,
    message,
    Space,
    Typography,
    Card,
    Select,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
    callGetAllPaymentOrders,
    callApproveOrder,
    callRejectOrder,
} from "@/apis/paymentOrderApi";
import { IPaymentOrderResponse, PaymentOrderStatus } from "@/types/backend";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { TextArea } = Input;

const STATUS_CONFIG: Record<
    PaymentOrderStatus,
    { color: string; label: string }
> = {
    PENDING: { color: "gold", label: "Chờ duyệt" },
    APPROVED: { color: "green", label: "Đã duyệt" },
    REJECTED: { color: "red", label: "Từ chối" },
};

const PREMIUM_LABELS: Record<string, string> = {
    MONTHLY_1: "1 Tháng",
    MONTHLY_3: "3 Tháng",
    MONTHLY_6: "6 Tháng",
    LIFETIME: "Trọn đời",
};

export default function AdminPaymentOrders() {
    const [orders, setOrders] = useState<IPaymentOrderResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [statusFilter, setStatusFilter] = useState<string | undefined>(
        undefined
    );

    // Modal states
    const [actionLoading, setActionLoading] = useState(false);
    
    // Approve Modal
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [approvingOrder, setApprovingOrder] = useState<IPaymentOrderResponse | null>(null);

    // Reject Modal
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectingOrder, setRejectingOrder] = useState<IPaymentOrderResponse | null>(null);
    const [rejectNote, setRejectNote] = useState("");

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const filterStr = statusFilter
                ? `status:'${statusFilter}'`
                : undefined;
            const res = await callGetAllPaymentOrders({
                page,
                size: pageSize,
                filter: filterStr,
            });
            const data = res.data?.result;
            if (data) {
                setOrders(data.content || []);
                setTotal(data.totalElements || 0);
            }
        } catch {
            message.error("Không thể tải danh sách đơn thanh toán");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [page, pageSize, statusFilter]);

    const handleApprove = async () => {
        if (!approvingOrder) return;
        setActionLoading(true);
        try {
            await callApproveOrder(approvingOrder.id);
            message.success("Đã duyệt đơn và kích hoạt Premium thành công!");
            setApproveModalOpen(false);
            fetchOrders();
        } catch (err: any) {
            message.error(
                err?.response?.data?.message || "Lỗi khi duyệt đơn"
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectingOrder) return;
        setActionLoading(true);
        try {
            await callRejectOrder(rejectingOrder.id, rejectNote);
            message.success("Đã từ chối đơn thanh toán");
            setRejectModalOpen(false);
            fetchOrders();
        } catch (err: any) {
            message.error(
                err?.response?.data?.message || "Lỗi khi từ chối đơn"
            );
        } finally {
            setActionLoading(false);
        }
    };

    const openApproveModal = (order: IPaymentOrderResponse) => {
        setApprovingOrder(order);
        setApproveModalOpen(true);
    };

    const openRejectModal = (order: IPaymentOrderResponse) => {
        setRejectingOrder(order);
        setRejectNote("");
        setRejectModalOpen(true);
    };

    const formatPrice = (v: number) =>
        v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    const columns: ColumnsType<IPaymentOrderResponse> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 70,
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: "User",
            key: "user",
            width: 180,
            render: (_, record) => (
                <div>
                    <div className="font-medium">{record.username}</div>
                    <div className="text-xs text-gray-400">{record.email}</div>
                </div>
            ),
        },
        {
            title: "Gói",
            dataIndex: "premiumType",
            key: "premiumType",
            width: 100,
            render: (type: string) => (
                <Tag color="blue">{PREMIUM_LABELS[type] || type}</Tag>
            ),
        },
        {
            title: "Số tiền",
            dataIndex: "amount",
            key: "amount",
            width: 120,
            render: (amount: number) => (
                <span className="font-semibold text-blue-600">
                    {formatPrice(amount)}đ
                </span>
            ),
        },
        {
            title: "Nội dung CK",
            dataIndex: "transferContent",
            key: "transferContent",
            width: 260,
            render: (text: string) => (
                <Typography.Paragraph
                    copyable={{ text }}
                    ellipsis={{ rows: 2, expandable: true, symbol: "Xem thêm" }}
                    className="!mb-0 font-mono text-xs text-gray-700 bg-gray-50 p-1.5 rounded border border-gray-100"
                >
                    {text}
                </Typography.Paragraph>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status: PaymentOrderStatus) => {
                const config = STATUS_CONFIG[status];
                return <Tag color={config.color}>{config.label}</Tag>;
            },
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 120,
        },
        {
            title: "Ghi chú Admin",
            dataIndex: "adminNote",
            key: "adminNote",
            width: 150,
            ellipsis: true,
            render: (note: string) => note || "—",
        },
        {
            title: "Hành động",
            key: "action",
            width: 200,
            fixed: "right",
            render: (_, record) => {
                if (record.status !== "PENDING") {
                    return (
                        <Tag
                            color={
                                record.status === "APPROVED" ? "green" : "red"
                            }
                        >
                            {record.status === "APPROVED"
                                ? "Đã duyệt"
                                : "Đã từ chối"}
                        </Tag>
                    );
                }
                return (
                    <Space>
                        <Button
                            type="primary"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            onClick={() => openApproveModal(record)}
                            loading={actionLoading}
                        >
                            Duyệt
                        </Button>
                        <Button
                            danger
                            size="small"
                            icon={<CloseCircleOutlined />}
                            onClick={() => openRejectModal(record)}
                            loading={actionLoading}
                        >
                            Từ chối
                        </Button>
                    </Space>
                );
            },
        },
    ];

    return (
        <div className="p-4 md:p-6">
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <Title level={4} className="!mb-0">
                        Quản lý đơn thanh toán
                    </Title>
                    <Select
                        placeholder="Lọc trạng thái"
                        allowClear
                        style={{ width: 180 }}
                        value={statusFilter}
                        onChange={(val) => {
                            setStatusFilter(val);
                            setPage(0);
                        }}
                        options={[
                            { value: "PENDING", label: "🟡 Chờ duyệt" },
                            { value: "APPROVED", label: "🟢 Đã duyệt" },
                            { value: "REJECTED", label: "🔴 Từ chối" },
                        ]}
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={orders}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1200 }}
                    pagination={{
                        current: page + 1,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50"],
                        onChange: (p, size) => {
                            setPage(p - 1);
                            setPageSize(size);
                        },
                        showTotal: (t) => `Tổng: ${t} đơn`,
                    }}
                    rowClassName={(record) =>
                        record.status === "PENDING"
                            ? "bg-yellow-50"
                            : ""
                    }
                />
            </Card>

            {/* Custom Approve Modal */}
            <Modal
                open={approveModalOpen}
                onCancel={() => setApproveModalOpen(false)}
                footer={null}
                centered
                styles={{
                    body: { padding: 0 }
                }}
                width={420}
            >
                <div className="p-6">
                    <div className="flex justify-center mb-4">
                        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-green-500 shadow-inner animate-pulse">
                            <CheckCircleOutlined className="text-2xl" />
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-center text-slate-800 mb-2">
                        Phê duyệt thanh toán
                    </h3>
                    
                    <p className="text-sm text-gray-500 text-center mb-6">
                        Xác kích hoạt Premium cho tài khoản này ngay lập tức?
                    </p>

                    {approvingOrder && (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-medium">Người dùng</span>
                                <span className="text-slate-800 font-semibold">{approvingOrder.username}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-medium">Gói đăng ký</span>
                                <span className="text-slate-800 font-bold bg-blue-50 text-[#3e66d4] px-2.5 py-0.5 rounded-full border border-blue-100">
                                    Premium {PREMIUM_LABELS[approvingOrder.premiumType] || approvingOrder.premiumType}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-medium">Số tiền</span>
                                <span className="text-green-600 font-black text-sm">{formatPrice(approvingOrder.amount)}đ</span>
                            </div>
                            <div className="flex justify-between items-start text-xs pt-2 border-t border-slate-200/50">
                                <span className="text-gray-400 font-medium mt-0.5">Nội dung CK</span>
                                <span className="font-mono text-[10px] text-gray-600 font-semibold break-all text-right max-w-[70%]">
                                    {approvingOrder.transferContent}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            onClick={() => setApproveModalOpen(false)}
                            className="flex-1 !h-11 rounded-xl font-medium border border-slate-200 hover:bg-slate-50 text-gray-500 transition-colors"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            loading={actionLoading}
                            onClick={handleApprove}
                            className="flex-1 !h-11 rounded-xl font-bold transition-all duration-300"
                            style={{
                                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                border: "none",
                                boxShadow: "0 4px 15px rgba(16, 185, 129, 0.25)",
                            }}
                        >
                            Duyệt đơn
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Custom Reject Modal */}
            <Modal
                open={rejectModalOpen}
                onCancel={() => setRejectModalOpen(false)}
                footer={null}
                centered
                styles={{
                    body: { padding: 0 }
                }}
                width={420}
            >
                <div className="p-6">
                    <div className="flex justify-center mb-4">
                        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500 shadow-inner">
                            <CloseCircleOutlined className="text-2xl" />
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-center text-slate-800 mb-2">
                        Từ chối thanh toán
                    </h3>
                    
                    <p className="text-sm text-gray-500 text-center mb-6">
                        Bạn chắc chắn muốn từ chối đơn thanh toán này?
                    </p>

                    {rejectingOrder && (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-medium">Người dùng</span>
                                <span className="text-slate-800 font-semibold">{rejectingOrder.username}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-medium">Gói đăng ký</span>
                                <span className="text-slate-800 font-bold bg-blue-50 text-[#3e66d4] px-2.5 py-0.5 rounded-full border border-blue-100">
                                    Premium {PREMIUM_LABELS[rejectingOrder.premiumType] || rejectingOrder.premiumType}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-medium">Số tiền</span>
                                <span className="text-[#3e66d4] font-black text-sm">{formatPrice(rejectingOrder.amount)}đ</span>
                            </div>
                        </div>
                    )}

                    <div className="mb-6">
                        <p className="text-xs font-semibold text-slate-500 mb-2">Lý do từ chối (tùy chọn):</p>
                        <TextArea
                            rows={3}
                            placeholder="VD: Chưa nhận được tiền chuyển khoản..."
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            className="rounded-xl border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={() => setRejectModalOpen(false)}
                            className="flex-1 !h-11 rounded-xl font-medium border border-slate-200 hover:bg-slate-50 text-gray-500 transition-colors"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            danger
                            loading={actionLoading}
                            onClick={handleReject}
                            className="flex-1 !h-11 rounded-xl font-bold transition-all duration-300"
                            style={{
                                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                border: "none",
                                boxShadow: "0 4px 15px rgba(239, 68, 68, 0.25)",
                            }}
                        >
                            Từ chối đơn
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
