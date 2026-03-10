import React, { useState, useEffect } from 'react'
import { categories as defaultCategories, assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import { Link } from 'react-router-dom'

const Categories = () => {
    const { navigate, axios } = useAppContext()
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
                            // For new categories, assign a default bgColor and image
                            const colors = ['#FEF6DA', '#FEE0E0', '#E1F5EC', '#FEE6CD', '#FEF3C7', '#D1FAE5'];
                            const colorIndex = cat.length % colors.length;
                            return {
                                text: cat,
                                path: cat,
                                bgColor: colors[colorIndex],
                                image: assets.upload_area // Use upload_area as default image
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
        <div className='mt-16'>
            <p className='text-2xl md:text-3xl font-medium'>Categories</p>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 mt-6 gap-6'>

                {categories.map((Category, index) => (
                    <div key={index} className='group cursor-pointer py-5 px-3 gap-2 rounded-lg flex flex-col justify-center items-center'
                        style={{ backgroundColor: Category.bgColor }}
                        onClick={() => {
                            navigate(`/products/${Category.path.toLowerCase()}`);
                            scrollTo(0, 0)
                        }}
                    >
                        <img src={Category.image} alt={Category.text} className='group-hover:scale-105 transition max-w-28' />
                        <p className='text-sm font-medium'>{Category.text}</p>
                    </div>
                ))}
            </div>
            <div className='flex justify-start mt-10'>
                <Link to={"/products"} className='group flex items-center gap-2 px-7 md:px-9 py-3 bg-transparent border border-black hover:border-white hover:bg-black hover:text-white transition rounded text-black cursor-pointer shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_15px_rgba(255,255,255,0.5)]'>
                    Shop now
                    <img className='transition group-hover:translate-x-1' src={assets.white_arrow_icon} alt='arrow' />
                </Link>
            </div>
        </div>
    )
}

export default Categories