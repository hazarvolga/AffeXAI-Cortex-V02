
import type { Menu } from './types';
import { productsMegaMenu, solutionsMegaMenu } from './data';

export const menus: Menu[] = [
  {
    id: 'main-nav',
    name: 'Ana Navigasyon',
    items: [
      {
        id: 'main-item-1',
        title: 'Çözümler',
        href: '/solutions',
        behavior: 'mega',
        megaMenuCategories: solutionsMegaMenu,
        parentId: null,
      },
      {
        id: 'main-item-2',
        title: 'Ürünler',
        href: '/products',
        behavior: 'mega',
        megaMenuCategories: productsMegaMenu,
        parentId: null,
      },
      {
        id: 'main-item-3',
        title: 'Eğitim & Destek',
        href: '/education',
        behavior: 'link',
        parentId: null,
      },
      {
        id: 'main-item-4',
        title: 'İndirme Merkezi',
        href: '/downloads',
        behavior: 'link',
        parentId: null,
      },
      {
        id: 'main-item-5',
        title: 'İletişim',
        href: '/contact',
        behavior: 'link',
        parentId: null,
      }
    ],
  },
  {
    id: 'footer-nav-explore',
    name: 'Footer - Keşfet',
    items: [
      { id: 'footer-exp-1', title: 'Çözümler', href: '/solutions', behavior: 'link', parentId: null },
      { id: 'footer-exp-2', title: 'Ürünler', href: '/products', behavior: 'link', parentId: null },
      { id: 'footer-exp-3', title: 'Başarı Hikayeleri', href: '/case-studies', behavior: 'link', parentId: null },
    ],
  },
    {
    id: 'footer-nav-support',
    name: 'Footer - Destek',
    items: [
        { id: 'footer-sup-1', title: 'Eğitim & Destek', href: '/education', behavior: 'link', parentId: null },
        { id: 'footer-sup-2', title: 'İndirme Merkezi', href: '/downloads', behavior: 'link', parentId: null },
        { id: 'footer-sup-3', title: 'İletişim', href: '/contact', behavior: 'link', parentId: null },
    ],
  },
];
