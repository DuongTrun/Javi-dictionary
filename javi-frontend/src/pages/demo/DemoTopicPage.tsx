/**
 * File này: Page DemoTopicPage.
 * Vai trò: Giao diện kiểm thử (UI Demo) hiển thị danh sách chủ đề tiếng Nhật dưới dạng bảng và cho phép thêm nhanh chủ đề mới.
 * Dùng khi: Người dùng truy cập đường dẫn /demo-topics.
 */
import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Card, Space, message, Typography } from "antd";
import { PlusOutlined, BookOutlined } from "@ant-design/icons";
import { callGetTopics, callCreateTopic } from "@/apis/topicApi";
import { ITopic } from "@/types/backend";

const { Title, Text } = Typography;
const { TextArea } = Input;

const DemoTopicPage: React.FC = () => {
  const [topics, setTopics] = useState<ITopic[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [form] = Form.useForm();

  // Hàm load danh sách chủ đề từ Backend
  const loadTopics = async () => {
    setLoading(true);
    try {
      const res = await callGetTopics();
      // axiosClient trả về response của Axios, dữ liệu nằm trong res.data
      // Cấu trúc API trả về là ApiResponse của Spring Boot có trường 'result'
      if (res.data && res.data.result) {
        setTopics(res.data.result);
      } else {
        setTopics([]);
      }
    } catch (error: any) {
      console.error("Lỗi khi load danh sách chủ đề:", error);
      message.error("Không thể kết nối đến máy chủ Backend!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  // Xử lý khi thêm mới chủ đề
  const handleCreate = async (values: any) => {
    try {
      const res = await callCreateTopic({
        nameVi: values.nameVi,
        nameJa: values.nameJa,
        description: values.description || "",
      });
      if (res.data && res.data.statusCode === 1000) {
        message.success("Thêm chủ đề mới thành công!");
        setIsModalOpen(false);
        form.resetFields();
        loadTopics(); // Reload danh sách
      } else {
        message.error(res.data?.message || "Có lỗi xảy ra khi tạo chủ đề.");
      }
    } catch (error: any) {
      console.error("Lỗi khi tạo chủ đề:", error);
      message.error(error.response?.data?.message || "Có lỗi xảy ra khi gọi API!");
    }
  };

  // Cấu hình các cột của bảng Ant Design Table
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Chủ đề (Tiếng Nhật)",
      dataIndex: "nameJa",
      key: "nameJa",
      render: (text: string) => <Text strong style={{ color: "#1890ff" }}>{text}</Text>,
    },
    {
      title: "Ý nghĩa (Tiếng Việt)",
      dataIndex: "nameVi",
      key: "nameVi",
      render: (text: string) => <Text>{text}</Text>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (text: string) => text ? <Text type="secondary">{text}</Text> : <Text type="secondary" italic>Không có mô tả</Text>,
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", padding: "0 20px" }}>
      <Card
        style={{
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          border: "none",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <Space size="middle">
            <BookOutlined style={{ fontSize: 28, color: "#1890ff" }} />
            <div>
              <Title level={3} style={{ margin: 0 }}>Demo: Quản Lý Chủ Đề Từ Vựng</Title>
              <Text type="secondary">Tính năng thử nghiệm kết nối Fullstack (React ↔ Spring Boot)</Text>
            </div>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            style={{ borderRadius: 8 }}
            onClick={() => setIsModalOpen(true)}
          >
            Thêm Chủ Đề
          </Button>
        </div>

        <Table
          dataSource={topics}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: "Chưa có chủ đề nào được tạo. Hãy tạo mới!" }}
          style={{ marginTop: 10 }}
        />
      </Card>

      {/* Modal Form thêm mới chủ đề */}
      <Modal
        title={<Title level={4} style={{ margin: 0 }}>Thêm Chủ Đề Mới</Title>}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="nameJa"
            label="Tên chủ đề bằng tiếng Nhật"
            rules={[{ required: true, message: "Vui lòng nhập tên tiếng Nhật!" }]}
          >
            <Input placeholder="Ví dụ: 旅行 (Ryokou)" size="large" />
          </Form.Item>

          <Form.Item
            name="nameVi"
            label="Ý nghĩa tiếng Việt"
            rules={[{ required: true, message: "Vui lòng nhập ý nghĩa tiếng Việt!" }]}
          >
            <Input placeholder="Ví dụ: Du lịch" size="large" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả ngắn"
          >
            <TextArea placeholder="Mô tả về từ vựng thuộc nhóm chủ đề này..." rows={3} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => {
                setIsModalOpen(false);
                form.resetFields();
              }}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" size="large" style={{ borderRadius: 6 }}>
                Lưu lại
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DemoTopicPage;
