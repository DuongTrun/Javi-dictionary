import { useEffect, useMemo, useState } from "react";

import { toast } from "react-toastify";

import {
    Button,
    Tag,
    Table,
    Space,
    Tooltip,
    Typography,
    Modal,
    Form,
    Input,
    Select,
    message,
    Popconfirm,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";
import { FiEdit, FiEye, FiTrash2 } from "react-icons/fi";

import {
    callCreateVocabulary,
    callDeleteVocabulary,
    callGetVocabularyById,
    callGetVocabularyPage,
    callUpdateVocabulary,
} from "@/apis/vocabularyApi";
import { callGetTopics } from "@/apis/topicApi";
import { useAuthStore } from "@/stores/useAuthStore";
import SearchResultModal from "@/components/search/SearchResultModal";
import type {
    IBackendRes,
    IVocabResponse,
    IVocabCreateRequest,
    IVocabUpdateRequest,
    IMeaning,
    ITopic,
} from "@/types/backend";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DOMPurify from "dompurify";

// Trả về null khi html rỗng (ví dụ "<p><br></p>"), hoặc trả về HTML đã sanitize nếu có nội dung
function cleanEmptyHtml(html?: string): string | null {
    if (!html) return null;
    const safe = DOMPurify.sanitize(html);
    const tmp = document.createElement("div");
    tmp.innerHTML = safe;
    const text = (tmp.textContent || "").replace(/\u00A0/g, "").trim();
    if (text.length === 0) {
        // nếu chỉ có media (img/video) bạn có thể giữ, ở đây ta coi là empty
        const hasMedia = !!tmp.querySelector("img,video,audio,iframe");
        if (!hasMedia) return null;
    }
    return safe;
}

// Lấy plain text từ HTML (dùng để kiểm tra rỗng khi render)
function htmlToPlainText(html?: string): string {
    if (!html) return "";
    const safe = DOMPurify.sanitize(html);
    const tmp = document.createElement("div");
    tmp.innerHTML = safe;
    return (tmp.textContent || "").replace(/\u00A0/g, "").trim();
}
const { Text } = Typography;

// map WordType enum -> nhãn tiếng Việt
const WORD_TYPE_OPTIONS = [
    { value: "NOUN", label: "Danh từ" },
    { value: "PRONOUN", label: "Đại từ" },
    { value: "ADJECTIVE_I", label: "Tính từ đuôi -i" },
    { value: "ADJECTIVE_NA", label: "Tính từ đuôi -na" },
    { value: "ADVERB", label: "Trạng từ" },
    { value: "PARTICLE", label: "Trợ từ" },
    { value: "CONJUNCTION", label: "Liên từ" },
    { value: "INTERJECTION", label: "Thán từ" },
    { value: "VERB", label: "Động từ" },
    { value: "VERB_GROUP_1", label: "Động từ nhóm 1" },
    { value: "VERB_GROUP_2", label: "Động từ nhóm 2" },
    { value: "VERB_GROUP_3", label: "Động từ nhóm 3" },
    { value: "AUXILIARY_VERB", label: "Trợ động từ" },
    { value: "IDIOM", label: "Thành ngữ" },
    { value: "PHRASE", label: "Cụm từ" },
    { value: "CUSTOM", label: "Khác" },
];

const JLPT_LEVEL_OPTIONS = [
    { label: "N5", value: "N5" },
    { label: "N4", value: "N4" },
    { label: "N3", value: "N3" },
    { label: "N2", value: "N2" },
    { label: "N1", value: "N1" },
];

function getWordTypeLabel(wordType: string | null | undefined): string {
    if (!wordType) return "";
    const found = WORD_TYPE_OPTIONS.find((w) => w.value === wordType);
    return found?.label ?? wordType;
}

function getLevelBgClass(level?: string | null): string {
    if (!level) return "bg-gray-400";
    return level === "N1"
        ? "bg-blue-600"
        : level === "N2"
        ? "bg-green-600"
        : level === "N3"
        ? "bg-yellow-500"
        : level === "N4"
        ? "bg-red-500"
        : "bg-purple-700";
}

type VocabFormModalMode = "create" | "edit";

interface VocabFormModalProps {
    mode: VocabFormModalMode;
    open: boolean;
    loading: boolean;
    initialValues?: Partial<IVocabResponse> | null;
    onCancel: () => void;
    onSubmit: (
        payload: IVocabCreateRequest | IVocabUpdateRequest
    ) => Promise<void>;
}

interface VocabSearchValues {
    keyword?: string;
    levels?: string[];
    wordType?: string;
}

// Modal form dùng chung cho tạo + sửa
function VocabFormModal({
    mode,
    open,
    loading,
    initialValues,
    onCancel,
    onSubmit,
}: VocabFormModalProps) {
    const [form] = Form.useForm();
    const [allTopics, setAllTopics] = useState<ITopic[]>([]);

    // Load danh sách chủ đề khi mở modal
    useEffect(() => {
        if (open) {
            const loadTopics = async () => {
                try {
                    const res = await callGetTopics();
                    if (res.data && res.data.result) {
                        setAllTopics(res.data.result);
                    }
                } catch (e) {
                    console.error("Lỗi khi load chủ đề trong Admin:", e);
                }
            };
            loadTopics();
        }
    }, [open]);

    // set lại giá trị mỗi khi mở modal / initialValues đổi
    useEffect(() => {
        if (!open) {
            form.resetFields();
            return;
        }

        if (initialValues && mode === "edit") {
            const defaultMeanings: IMeaning[] = initialValues.meanings ?? [];
            form.setFieldsValue({
                id: initialValues.id,
                word: initialValues.word,
                wordType: initialValues.wordType,
                level: initialValues.level,
                romaji: initialValues.romaji ?? "",
                hiragana: initialValues.hiragana ?? "",
                katakana: initialValues.katakana ?? "",
                topicIds: initialValues.topics?.map((t) => t.id) ?? [],
                meanings:
                    defaultMeanings.length > 0
                        ? defaultMeanings.map((m) => ({
                              id: m.id,
                              meaningVn: m.meaningVn,
                              description: m.description,
                              examples:
                                  m.examples?.length > 0
                                      ? m.examples.map((ex) => ({
                                            id: ex.id,
                                            jaSentence: ex.jaSentence,
                                            viSentence: ex.viSentence,
                                        }))
                                      : [
                                            {
                                                jaSentence: "",
                                                viSentence: "",
                                            },
                                        ],
                          }))
                        : [
                              {
                                  meaningVn: "",
                                  description: "",
                                  examples: [
                                      {
                                          jaSentence: "",
                                          viSentence: "",
                                      },
                                  ],
                              },
                          ],
            });
        } else {
            form.setFieldsValue({
                word: "",
                wordType: undefined,
                level: undefined,
                romaji: "",
                hiragana: "",
                katakana: "",
                topicIds: [],
                meanings: [
                    {
                        meaningVn: "",
                        description: "",
                        examples: [
                            {
                                jaSentence: "",
                                viSentence: "",
                            },
                        ],
                    },
                ],
            });
        }
    }, [open, initialValues, mode, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();

            const rawMeanings = values.meanings || [];

            const processedMeanings = rawMeanings.map((m: any) => ({
                meaningVn: m.meaningVn ?? null,
                description: cleanEmptyHtml(m.description as string),
                examples:
                    m.examples?.map((ex: any) => ({
                        jaSentence: ex.jaSentence,
                        viSentence: ex.viSentence,
                    })) ?? [],
            }));

            const payload: any = {
                word: values.word,
                wordType: values.wordType,
                level: values.level,
                romaji: values.romaji?.trim() || null,
                hiragana: values.hiragana?.trim() || null,
                katakana: values.katakana?.trim() || null,
                meanings: processedMeanings,
                topicIds: values.topicIds ?? [],
            };

            await onSubmit(payload);
        } catch (err: any) {
            if (err?.errorFields) {
                return;
            }
            console.error("Lỗi xử lý form từ vựng:", err);
            const errMsg =
                err?.response?.data?.message ||
                err?.message ||
                "Xử lý form từ vựng thất bại";
            message.error(errMsg);
        }
    };

    return (
        <Modal
            title={
                <span className="text-[16px] font-normal">
                    {mode === "create"
                        ? "Tạo từ vựng mới"
                        : "Chỉnh sửa từ vựng"}
                </span>
            }
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
            okText={mode === "create" ? "Tạo" : "Lưu"}
            cancelText="Hủy"
            confirmLoading={loading}
            width={900}
            className="with-padding-modal"
            cancelButtonProps={{
                className:
                    "!text-red-600 hover:!text-white hover:!bg-red-500 hover:!border-red-500",
            }}
        >
            <Form form={form} layout="vertical">
                {/* Hàng trên: từ, loại, level (giữ nguyên) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Form.Item
                        name="word"
                        label="Từ tiếng Nhật"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập từ tiếng Nhật",
                            },
                        ]}
                    >
                        <Input placeholder="Nhập từ tiếng Nhật" />
                    </Form.Item>

                    <Form.Item
                        name="wordType"
                        label="Từ loại"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn từ loại",
                            },
                        ]}
                    >
                        <Select
                            placeholder="Chọn từ loại"
                            options={WORD_TYPE_OPTIONS}
                            showSearch
                            optionFilterProp="label"
                        />
                    </Form.Item>

                    <Form.Item
                        name="level"
                        label="Trình độ (JLPT)"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn trình độ",
                            },
                        ]}
                    >
                        <Select
                            placeholder="Chọn level"
                            options={JLPT_LEVEL_OPTIONS}
                        />
                    </Form.Item>
                </div>

                {/* Hàng dưới: romaji / hiragana / katakana */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <Form.Item
                        name="romaji"
                        label="Romaji"
                        tooltip="Cách đọc romaji (nếu có)"
                    >
                        <Input placeholder="Nhập cách đọc romaji (nếu có)" />
                    </Form.Item>

                    <Form.Item
                        name="hiragana"
                        label="Hiragana"
                        tooltip="Cách đọc hiragana (nếu có)"
                    >
                        <Input placeholder="Nhập hiragana (nếu có)" />
                    </Form.Item>

                    <Form.Item
                        name="katakana"
                        label="Katakana"
                        tooltip="Cách đọc katakana (nếu có)"
                    >
                        <Input placeholder="Nhập katakana (nếu có)" />
                    </Form.Item>
                </div>

                {/* Chọn chủ đề */}
                <div className="mt-4">
                    <Form.Item
                        name="topicIds"
                        label="Chủ đề từ vựng"
                        tooltip="Chọn các chủ đề cho từ vựng này (chọn nhiều)"
                    >
                        <Select
                            mode="multiple"
                            placeholder="Chọn chủ đề"
                            style={{ width: "100%" }}
                            options={allTopics.map((t) => ({
                                label: `${t.nameJa} (${t.nameVi})`,
                                value: t.id,
                            }))}
                            showSearch
                            optionFilterProp="label"
                        />
                    </Form.Item>
                </div>

                <Form.List name="meanings">
                    {(fields, { add, remove }) => (
                        <div className="space-y-4 mt-4">
                            {fields.map((field, index) => (
                                <div
                                    key={field.key}
                                    className="border border-gray-200 rounded-lg p-3"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <Text strong>Nghĩa {index + 1}</Text>
                                        {fields.length > 1 && (
                                            <Button
                                                size="small"
                                                danger
                                                type="text"
                                                onClick={() =>
                                                    remove(field.name)
                                                }
                                            >
                                                Xóa nghĩa này
                                            </Button>
                                        )}
                                    </div>

                                    <Form.Item
                                        {...field}
                                        name={[field.name, "meaningVn"]}
                                        label="Nghĩa tiếng Việt"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    "Vui lòng nhập nghĩa tiếng Việt",
                                            },
                                        ]}
                                    >
                                        <ReactQuill theme="snow" />
                                    </Form.Item>

                                    <Form.Item
                                        {...field}
                                        name={[field.name, "description"]}
                                        label="Mô tả thêm (tuỳ chọn)"
                                    >
                                        <ReactQuill theme="snow" />
                                    </Form.Item>

                                    <Form.List name={[field.name, "examples"]}>
                                        {(exampleFields, exampleOps) => (
                                            <div className="mt-2 space-y-2">
                                                <div className="flex justify-between items-center mb-1">
                                                    <Text strong>Ví dụ</Text>
                                                </div>

                                                {exampleFields.map(
                                                    (exField, exIdx) => (
                                                        <div
                                                            key={exField.key}
                                                            className="border border-dashed border-blue-200 bg-blue-50 rounded-md p-2"
                                                        >
                                                            <div className="flex justify-between items-center mb-1">
                                                                <Text>
                                                                    Câu ví dụ{" "}
                                                                    {exIdx + 1}
                                                                </Text>
                                                                {exampleFields.length >
                                                                    1 && (
                                                                    <Button
                                                                        size="small"
                                                                        danger
                                                                        type="text"
                                                                        onClick={() =>
                                                                            exampleOps.remove(
                                                                                exField.name
                                                                            )
                                                                        }
                                                                    >
                                                                        Xóa
                                                                    </Button>
                                                                )}
                                                            </div>

                                                            <Form.Item
                                                                {...exField}
                                                                name={[
                                                                    exField.name,
                                                                    "jaSentence",
                                                                ]}
                                                                label="Câu tiếng Nhật"
                                                                rules={[
                                                                    {
                                                                        required:
                                                                            true,
                                                                        message:
                                                                            "Vui lòng nhập câu tiếng Nhật",
                                                                    },
                                                                ]}
                                                            >
                                                                <Input.TextArea
                                                                    rows={2}
                                                                    placeholder="Nhập câu tiếng Nhật"
                                                                />
                                                            </Form.Item>

                                                            <Form.Item
                                                                {...exField}
                                                                name={[
                                                                    exField.name,
                                                                    "viSentence",
                                                                ]}
                                                                label="Câu tiếng Việt"
                                                                rules={[
                                                                    {
                                                                        required:
                                                                            true,
                                                                        message:
                                                                            "Vui lòng nhập câu tiếng Việt",
                                                                    },
                                                                ]}
                                                            >
                                                                <Input.TextArea
                                                                    rows={2}
                                                                    placeholder="Nhập câu tiếng Việt"
                                                                />
                                                            </Form.Item>
                                                        </div>
                                                    )
                                                )}

                                                {/* Nút thêm ví dụ nằm dưới cùng mỗi nghĩa */}
                                                <div className="pt-1">
                                                    <Button
                                                        size="small"
                                                        type="dashed"
                                                        onClick={() =>
                                                            exampleOps.add({
                                                                jaSentence: "",
                                                                viSentence: "",
                                                            })
                                                        }
                                                        block
                                                    >
                                                        Thêm ví dụ
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </Form.List>
                                </div>
                            ))}

                            <Button
                                type="dashed"
                                onClick={() =>
                                    add({
                                        meaningVn: "",
                                        description: "",
                                        examples: [
                                            {
                                                jaSentence: "",
                                                viSentence: "",
                                            },
                                        ],
                                    })
                                }
                                block
                            >
                                Thêm nghĩa
                            </Button>
                        </div>
                    )}
                </Form.List>
            </Form>
        </Modal>
    );
}

// ========================= Trang quản lý từ vựng =========================

export default function AdminVocabulary() {
    const currentUser = useAuthStore((s) => s.user);
    const [searchForm] = Form.useForm<VocabSearchValues>();

    const hasPermission = (perm: string) =>
        currentUser?.role?.permissions?.some((p: any) => p.name === perm) ??
        false;

    const canCreate = hasPermission("CREATE_VOCABULARY");
    const canEdit = hasPermission("UPDATE_VOCABULARY");
    const canDelete = hasPermission("DELETE_VOCABULARY");

    const [data, setData] = useState<IVocabResponse[]>([]);
    const [page, setPage] = useState(1); // AntD 1-based
    const [size, setSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const [searchValues, setSearchValues] = useState<VocabSearchValues>({});

    // modal xem chi tiết
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailEntityId, setDetailEntityId] = useState<number | null>(null);

    // modal tạo / sửa từ vựng
    const [formMode, setFormMode] = useState<VocabFormModalMode>("create");
    const [formOpen, setFormOpen] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [editingVocab, setEditingVocab] = useState<IVocabResponse | null>(
        null
    );

    // build chuỗi filter turkraft cho màn vocab
    const buildVocabFilter = (
        values: VocabSearchValues
    ): string | undefined => {
        const parts: string[] = [];

        if (values.keyword && values.keyword.trim()) {
            const kw = values.keyword.trim().replace(/'/g, "");
            parts.push(
                `(word ~ '${kw}' or romaji ~ '${kw}' or hiragana ~ '${kw}' or katakana ~ '${kw}' or meanings.meaningVn ~ '${kw}')`
            );
        }

        if (values.levels && values.levels.length > 0) {
            if (values.levels.length === 1) {
                parts.push(`level : '${values.levels[0]}'`);
            } else {
                const lvList = values.levels.map((lv) => `'${lv}'`).join(", ");
                parts.push(`level in [${lvList}]`);
            }
        }

        if (values.wordType) {
            parts.push(`wordType : '${values.wordType}'`);
        }

        if (parts.length === 0) return undefined;
        return parts.join(" and ");
    };

    useEffect(() => {
        loadVocab();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, size, searchValues]);

    async function loadVocab() {
        try {
            setLoading(true);
            const params: any = {
                page: page - 1,
                size,
                sort: "vocabId,desc",
            };

            const filter = buildVocabFilter(searchValues);
            if (filter) {
                params.filter = filter;
            }

            const res = await callGetVocabularyPage(params);
            const body = (res?.data || res) as IBackendRes<any>;
            const pageData =
                (body.result as any) || (body.data as any) || (body as any);

            const content: IVocabResponse[] = pageData?.content ?? [];
            const totalElements: number =
                pageData?.totalElements ?? pageData?.total ?? 0;

            setData(content);
            setTotal(totalElements);
        } catch (err: any) {
            console.error("Lấy danh sách từ vựng thất bại:", err);
            const errMsg =
                err?.response?.data?.message ||
                err?.message ||
                "Lấy danh sách từ vựng thất bại";
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    }

    const columns: ColumnsType<IVocabResponse> = useMemo(
        () => [
            {
                title: "Từ vựng",
                dataIndex: "word",
                key: "word",
                render: (_: any, record: IVocabResponse) => (
                    <div className="space-y-1">
                        <Text className="text-3xl text-[#3e67d6] font-mplus font-normal truncate">
                            {record.word}
                        </Text>
                        <div className="flex flex-col text-xs text-gray-600 ">
                            {record.romaji && (
                                <span>Romaji: {record.romaji}</span>
                            )}

                            {(record.hiragana || record.katakana) && (
                                <span>
                                    {record.hiragana &&
                                        `Hiragana: ${record.hiragana}`}
                                    {record.hiragana &&
                                        record.katakana &&
                                        " · "}
                                    {record.katakana &&
                                        `Katakana: ${record.katakana}`}
                                </span>
                            )}
                        </div>
                    </div>
                ),
            },
            {
                title: "Từ loại",
                dataIndex: "wordType",
                key: "wordType",
                width: 160,
                align: "center",
                render: (value: string) => (
                    <Tag color="blue">{getWordTypeLabel(value)}</Tag>
                ),
            },
            {
                title: "Level",
                dataIndex: "level",
                key: "level",
                width: 100,
                align: "center",
                render: (lv: string) => (
                    <span
                        className={`inline-flex px-3 py-0.5 rounded-full text-xs font-medium text-white ${getLevelBgClass(
                            lv
                        )}`}
                    >
                        {lv}
                    </span>
                ),
            },
            {
                title: "Nghĩa",
                dataIndex: "meanings",
                key: "meanings",
                render: (meanings: IMeaning[]) => {
                    if (!meanings || meanings.length === 0) {
                        return <span className="text-gray-400">—</span>;
                    }

                    // Lấy toàn bộ nghĩa (có thể lưu dưới dạng HTML); chuyển sang plain text,
                    // trim, loại bỏ rỗng, và thêm "-"" vào đầu mỗi dòng
                    const lines = meanings
                        .map((m) => htmlToPlainText(m?.meaningVn ?? ""))
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((t) => `- ${t}`);

                    return (
                        <div className="text-sm text-gray-500 whitespace-pre-line break-words">
                            {lines.join("\n")}
                        </div>
                    );
                },
            },
            {
                title: "Hành động",
                key: "actions",
                width: 210,
                align: "center",
                render: (_: any, record: IVocabResponse) => (
                    <Space
                        size="small"
                        style={{
                            display: "flex",
                            width: "100%",
                            justifyContent: "center",
                        }}
                    >
                        <Tooltip title="Xem chi tiết">
                            <button
                                onClick={() => {
                                    setDetailEntityId(record.id);
                                    setDetailOpen(true);
                                }}
                                className="px-3 py-[5px] flex items-center gap-1 rounded-md text-white bg-blue-500 hover:bg-blue-600 transition"
                            >
                                <FiEye className="text-[15px]" />
                                Xem
                            </button>
                        </Tooltip>

                        {canEdit && (
                            <Tooltip title="Chỉnh sửa từ vựng">
                                <button
                                    onClick={() => openEditVocabById(record.id)}
                                    className="px-3 py-[5px] flex items-center gap-1 rounded-md text-white bg-amber-500 hover:bg-amber-600 transition"
                                >
                                    <FiEdit className="text-[15px]" />
                                    Sửa
                                </button>
                            </Tooltip>
                        )}

                        {canDelete && (
                            <Tooltip title="Xóa từ vựng">
                                <Popconfirm
                                    title="Xóa từ vựng"
                                    description="Bạn có chắc muốn xóa từ vựng này?"
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                    onConfirm={() =>
                                        handleDeleteVocabulary(record.id)
                                    }
                                >
                                    <button className="px-3 py-[5px] flex items-center gap-1 rounded-md text-white bg-red-500 hover:bg-red-600 transition">
                                        <FiTrash2 className="text-[15px]" />
                                        Xóa
                                    </button>
                                </Popconfirm>
                            </Tooltip>
                        )}
                    </Space>
                ),
            },
        ],
        [canEdit, canDelete]
    );

    const openCreateModal = () => {
        setFormMode("create");
        setEditingVocab(null);
        setFormOpen(true);
    };

    const openEditVocabById = async (id: number) => {
        try {
            setFormMode("edit");
            setFormLoading(true);
            setFormOpen(true);

            const res = await callGetVocabularyById(id, { saveHistory: false });
            const body = (res?.data || res) as IBackendRes<IVocabResponse>;
            const vocab =
                (body.result as IVocabResponse) ||
                (body.data as IVocabResponse) ||
                (body as any);
            if (!vocab || !vocab.id) {
                throw new Error("Không tìm thấy dữ liệu từ vựng");
            }
            setEditingVocab(vocab);
        } catch (err: any) {
            console.error("Lấy chi tiết từ vựng thất bại:", err);
            const errMsg =
                err?.response?.data?.message ||
                err?.message ||
                "Lấy chi tiết từ vựng thất bại";
            toast.error(errMsg);
            setFormOpen(false);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteVocabulary = async (id: number) => {
        try {
            const res = await callDeleteVocabulary(id);
            const body = (res?.data || res) as IBackendRes<void>;
            const msg = body?.message || "Xóa từ vựng thành công";
            toast.success(msg);
            loadVocab();
        } catch (err: any) {
            console.error("Xóa từ vựng thất bại:", err);
            const errMsg =
                err?.response?.data?.message ||
                err?.message ||
                "Xóa từ vựng thất bại";
            toast.error(errMsg);
        }
    };

    const handleSubmitForm = async (
        payload: IVocabCreateRequest | IVocabUpdateRequest
    ) => {
        try {
            setFormLoading(true);

            if (formMode === "create") {
                const res = await callCreateVocabulary(
                    payload as IVocabCreateRequest
                );
                const body = (res?.data || res) as IBackendRes<IVocabResponse>;
                const vocab =
                    (body.result as IVocabResponse) ||
                    (body.data as IVocabResponse);
                if (!vocab || !vocab.id) {
                    toast.error(
                        "Tạo từ vựng thất bại: server không trả về dữ liệu."
                    );
                    return;
                }
                toast.success("Tạo từ vựng thành công");
            } else if (formMode === "edit") {
                const id = editingVocab?.id;
                if (!id) {
                    toast.error("Thiếu ID từ vựng khi cập nhật");
                    return;
                }
                const res = await callUpdateVocabulary(
                    id,
                    payload as IVocabUpdateRequest
                );
                const body = (res?.data || res) as IBackendRes<IVocabResponse>;
                const vocab =
                    (body.result as IVocabResponse) ||
                    (body.data as IVocabResponse);
                if (!vocab || !vocab.id) {
                    toast.error(
                        "Cập nhật từ vựng thất bại: server không trả về dữ liệu."
                    );
                    return;
                }
                toast.success("Cập nhật từ vựng thành công");
            }

            setFormOpen(false);
            setEditingVocab(null);
            loadVocab();
        } catch (err: any) {
            console.error("Lưu từ vựng thất bại:", err);
            const errMsg =
                err?.response?.data?.message ||
                err?.message ||
                "Lưu từ vựng thất bại";
            message.error(errMsg);
        } finally {
            setFormLoading(false);
        }
    };

    const handleSearchSubmit = (values: VocabSearchValues) => {
        setPage(1);
        setSearchValues(values);
    };

    const handleSearchReset = () => {
        searchForm.resetFields();
        setPage(1);
        setSearchValues({});
    };

    return (
        <div className="py-4 px-2">
            {/* Khu vực tìm kiếm: layout giống màn quản lý user */}
            <Form<VocabSearchValues>
                form={searchForm}
                layout="vertical"
                onFinish={handleSearchSubmit}
            >
                <div className="bg-white rounded-2xl shadow p-4 mb-3">
                    <div className="flex flex-col gap-3">
                        {/* Hàng trên: từ khóa + nút tìm kiếm */}
                        <div className="flex flex-col md:flex-row md:items-end gap-3">
                            <Form.Item
                                name="keyword"
                                label="Từ khóa"
                                className="mb-0 flex-1"
                            >
                                <Input.Search
                                    allowClear
                                    placeholder="Tìm theo từ, nghĩa hoặc cách đọc"
                                    autoComplete="off"
                                    onSearch={() => searchForm.submit()}
                                />
                            </Form.Item>

                            <div className="flex gap-2 md:justify-end">
                                <Button type="primary" htmlType="submit">
                                    Tìm kiếm
                                </Button>
                            </div>
                        </div>

                        {/* Hàng dưới: filter + nút xóa lọc */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <Form.Item
                                name="levels"
                                label="Trình độ (JLPT)"
                                className="mb-0"
                            >
                                <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="Tất cả"
                                    options={JLPT_LEVEL_OPTIONS}
                                />
                            </Form.Item>

                            <Form.Item
                                name="wordType"
                                label="Từ loại"
                                className="mb-0"
                            >
                                <Select
                                    allowClear
                                    placeholder="Tất cả"
                                    options={WORD_TYPE_OPTIONS}
                                    showSearch
                                    optionFilterProp="label"
                                />
                            </Form.Item>

                            {/* cột thứ 3: nằm cùng hàng filter, nhưng căn phải dưới nút Tìm kiếm */}
                            <div className="flex justify-start md:justify-end">
                                <Button
                                    onClick={handleSearchReset}
                                    className="w-full md:w-auto hover:!border-red-500 hover:!text-red-500"
                                >
                                    Xóa lọc
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Form>

            <div className="bg-white rounded-2xl shadow p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-base"></h3>

                    {canCreate && (
                        <Button
                            icon={<PlusOutlined />}
                            className="!bg-green-500 !text-white !border-none hover:!bg-green-600 hover:!text-white"
                            onClick={openCreateModal}
                        >
                            Tạo từ vựng
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <Table
                        rowKey="id"
                        loading={loading}
                        columns={columns}
                        dataSource={data}
                        pagination={{
                            current: page,
                            pageSize: size,
                            total,
                            showSizeChanger: true,
                            pageSizeOptions: ["5", "10", "20", "50"],
                            position: ["bottomCenter"],
                            onChange: (
                                pageNum: number,
                                pageSizeNew?: number
                            ) => {
                                setPage(pageNum);
                                if (pageSizeNew && pageSizeNew !== size) {
                                    setSize(pageSizeNew);
                                }
                            },
                        }}
                        scroll={{ x: 800 }}
                    />
                </div>
            </div>

            {/* Modal xem chi tiết */}
            {detailEntityId !== null && (
                <SearchResultModal
                    open={detailOpen}
                    onClose={() => {
                        setDetailOpen(false);
                        setDetailEntityId(null);
                    }}
                    entityType="WORD"
                    entityId={detailEntityId}
                />
            )}

            {/* Modal tạo / sửa từ vựng */}
            <VocabFormModal
                mode={formMode}
                open={formOpen}
                loading={formLoading}
                initialValues={formMode === "edit" ? editingVocab : null}
                onCancel={() => {
                    setFormOpen(false);
                    setEditingVocab(null);
                }}
                onSubmit={handleSubmitForm}
            />
        </div>
    );
}
