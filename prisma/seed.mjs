import { PrismaClient } from '@prisma/client';
const prisma=new PrismaClient();
const products=[
{name:'World Crazy Graphic Tee',category:'Clothes',price:null,image:'/images/world-crazy.jpg'},
{name:'Luxury Red Window Fragrance Mist',category:'Perfumes',price:null,image:'/images/red-window.jpg'},
{name:'Premium Black Slides',category:'Slippers',price:null,image:'/images/slides-1.jpg'},
{name:'Luxury Fashion Gown',category:'Clothes',price:12000,image:'/images/gown.jpg'},
{name:'Classic Denim Jeans',category:'Clothes',price:null,image:'/images/jeans.jpg'},
{name:'Essential White Tee',category:'Clothes',price:null,image:'/images/shirt-white.jpg'}
];
for(const p of products) await prisma.product.create({data:p});
await prisma.$disconnect();
