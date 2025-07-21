import React from 'react';
import { categories } from '../assets/assets';
import { NavLink } from 'react-router-dom';

const CategoryNav = () => {
  return (
    <nav className="w-full bg-white shadow-sm py-1 mb-1 overflow-x-auto sticky top-[60px] z-40">
      <div className="flex gap-2 px-2 md:px-8 lg:px-6 xl:px-8 whitespace-nowrap">
        {categories.map((cat) => (
          <NavLink
            key={cat.path}
            to={`/products?category=${cat.path}`}
            className={({ isActive }) =>
              `flex items-center gap-1 px-2 py-0.5 rounded-full text-xs md:text-sm transition border border-transparent hover:border-gray-300 ${isActive ? 'bg-gray-200 font-semibold' : ''}`
            }
            style={{ backgroundColor: cat.bgColor || undefined }}
          >
            {cat.image && (
              <img src={cat.image} alt={cat.text} className="w-4 h-4 object-contain" />
            )}
            <span>{cat.text}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default CategoryNav; 