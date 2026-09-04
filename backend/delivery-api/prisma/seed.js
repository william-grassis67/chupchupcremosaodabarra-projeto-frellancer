const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const burgers = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: { nome: 'hamburgers', descricao: 'Classic and gourmet burgers', ativo: true },
  });

  const drinks = await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: { nome: 'drinks', descricao: 'Sodas, juices and more', ativo: true },
  });

  await prisma.product.createMany({
    data: [
      {
        nome: 'Classic Cheeseburger',
        descricao: 'Beef patty, cheddar, lettuce, tomato and special sauce',
        preco: 25.9,
        imagem: 'https://example.com/images/cheeseburger.jpg',
        disponivel: true,
        destaque: true,
        categoriaId: burgers.id,
      },
      {
        nome: 'Bacon Burger',
        descricao: 'Beef patty, crispy bacon, cheddar and BBQ sauce',
        preco: 29.9,
        imagem: 'https://example.com/images/bacon-burger.jpg',
        disponivel: true,
        destaque: false,
        categoriaId: burgers.id,
      },
      {
        nome: 'Soda 350ml',
        descricao: 'Chilled soft drink can',
        preco: 6.5,
        imagem: 'https://example.com/images/soda.jpg',
        disponivel: true,
        destaque: false,
        categoriaId: drinks.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completed.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
