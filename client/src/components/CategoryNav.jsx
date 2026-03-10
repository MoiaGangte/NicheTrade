import React, { useState, useEffect } from 'react';
import { categories as defaultCategories } from '../assets/assets';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const CategoryNav = () => {
  const { axios } = useAppContext();
  const [categories, setCategories] = useState(defaultCategories);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/api/product/categories');
        if (data.success) {
          // Merge API categories with default categories
          const apiCategories = data.categories.map(cat => {
            const defaultCat = defaultCategories.find(dc => dc.path === cat);
            if (defaultCat) {
              return defaultCat;
            } else {
              // For new categories, assign a default bgColor
              const colors = ['#FEF6DA', '#FEE0E0', '#E1F5EC', '#FEE6CD', '#FEF3C7', '#D1FAE5'];
              const colorIndex = cat.length % colors.length;
              return {
                text: cat,
                path: cat,
                bgColor: colors[colorIndex]
              };
            }
          });
          setCategories(apiCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to default categories
      }
    };

    fetchCategories();
  }, [axios]);

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