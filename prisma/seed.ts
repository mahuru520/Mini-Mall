import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 清空现有数据（按外键依赖顺序）
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // ============ 分类 ============
  const categories = await Promise.all([
    prisma.category.create({ data: { name: "数码电子", slug: "digital", description: "手机、电脑、配件等" } }),
    prisma.category.create({ data: { name: "服装鞋帽", slug: "clothing", description: "男装、女装、鞋靴" } }),
    prisma.category.create({ data: { name: "家居生活", slug: "home", description: "家具、厨具、装饰" } }),
    prisma.category.create({ data: { name: "食品饮料", slug: "food", description: "零食、饮品、生鲜" } }),
    prisma.category.create({ data: { name: "图书教育", slug: "books", description: "教材、小说、工具书" } }),
  ]);

  // ============ 商品 ============
  const products = [
    // 数码电子
    { name: "无线蓝牙耳机", description: "高音质降噪蓝牙耳机，续航30小时", price: 199.00, stock: 50, categoryId: categories[0].id, imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=耳机" },
    { name: "机械键盘 87键", description: "青轴机械键盘，RGB背光", price: 349.00, stock: 30, categoryId: categories[0].id, imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=键盘" },
    { name: "便携充电宝 20000mAh", description: "快充移动电源，双USB输出", price: 129.00, stock: 100, categoryId: categories[0].id, imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=充电宝" },

    // 服装鞋帽
    { name: "纯棉T恤 男款", description: "100%纯棉，舒适透气", price: 79.00, stock: 200, categoryId: categories[1].id, imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=T恤" },
    { name: "运动跑鞋", description: "轻量缓震，透气网面", price: 299.00, stock: 60, categoryId: categories[1].id, imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=跑鞋" },
    { name: "牛仔外套", description: "经典款式，四季百搭", price: 259.00, stock: 40, categoryId: categories[1].id, imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=外套" },

    // 家居生活
    { name: "北欧风台灯", description: "三色调光，护眼光源", price: 159.00, stock: 80, categoryId: categories[2].id, imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=台灯" },
    { name: "不锈钢保温杯 500ml", description: "12小时保温，真空双层", price: 89.00, stock: 150, categoryId: categories[2].id, imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=保温杯" },
    { name: "记忆棉枕头", description: "慢回弹颈椎枕，助眠舒适", price: 129.00, stock: 70, categoryId: categories[2].id, imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=枕头" },

    // 食品饮料
    { name: "坚果礼盒 1kg", description: "每日坚果混合装", price: 69.00, stock: 200, categoryId: categories[3].id, imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=坚果" },
    { name: "冷萃咖啡 12瓶装", description: "即饮冷萃，醇厚无糖", price: 49.00, stock: 300, categoryId: categories[3].id, imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=咖啡" },

    // 图书教育
    { name: "JavaScript 高级程序设计", description: "前端开发经典教材第4版", price: 99.00, stock: 50, categoryId: categories[4].id, imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=JS书" },
    { name: "设计模式：可复用面向对象软件的基础", description: "GoF 经典之作", price: 59.00, stock: 40, categoryId: categories[4].id, imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=设计模式" },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  // ============ 用户 ============
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  await prisma.user.create({
    data: { name: "管理员", email: "admin@minimall.com", password: adminPassword, role: "ADMIN" },
  });
  await prisma.user.create({
    data: { name: "测试用户", email: "user@minimall.com", password: userPassword, role: "CUSTOMER" },
  });

  console.log("✅ 种子数据创建完成！");
  console.log("  分类: 5 个");
  console.log("  商品: 13 个");
  console.log("  用户: admin@minimall.com / admin123 (ADMIN)");
  console.log("  用户: user@minimall.com / user123 (CUSTOMER)");
}

main()
  .catch((e) => {
    console.error("❌ 种子数据创建失败:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
