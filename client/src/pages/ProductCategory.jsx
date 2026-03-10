import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { useParams } from 'react-router-dom'
import { categories as defaultCategories } from '../assets/assets'
import ProductCart from '../components/ProductCart'

const ProductCategory = () => {
    const {products, axios} = useAppContext()
    const {category} = useParams()
    const [allCategories, setAllCategories] = useState(defaultCategories);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await axios.get('/api/product/categories');
                if (data.success) {
                    const apiCategories = data.categories.map(cat => {
                        const defaultCat = defaultCategories.find(dc => dc.path === cat);
                        if (defaultCat) {
                            return defaultCat;
                        } else {
                            const colors = ['#FEF6DA', '#FEE0E0', '#E1F5EC', '#FEE6CD', '#FEF3C7', '#D1FAE5'];
                            const colorIndex = cat.length % colors.length;
                            return {
                                text: cat,
                                path: cat,
                                bgColor: colors[colorIndex]
                            };
                        }
                    });
                    setAllCategories(apiCategories);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, [axios]);

    const searchCategory = allCategories.find((item)=> item.path.toLowerCase() === category)

    // Only show products that are specifically added to this category
    const filteredProducts = products.filter((product)=> 
        product.category && 
        product.category.toLowerCase() === category &&
        product.showInCategory // Only show products that are meant to be shown in category
    );

    return (
        <div className='mt-16'>
            {searchCategory && (
                <div className='flex flex-col items-end w-max'>
                    <p className='text-2xl font-medium'>{searchCategory.text.toUpperCase()}</p>
                    <div className='w-16 h-0.5 bg-[var(--color-primary)] rounded-full'></div>
                </div>
            )}
            {!searchCategory && (
                <div className='flex flex-col items-end w-max'>
                    <p className='text-2xl font-medium'>{category.toUpperCase()}</p>
                    <div className='w-16 h-0.5 bg-[var(--color-primary)] rounded-full'></div>
                </div>
            )}
            {filteredProducts.length > 0 ? (
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 mt-6'>
                    {filteredProducts.map((product)=>(
                        <ProductCart key={product._id} product={product}/>
                    ))}
                </div>
            ): (
                <div className='flex items-center justify-center h-[60vh]'>
                    <p className='text-2xl font-medium text-[var(--color-primary)]'>SORRY! No product found in this category </p>
                </div>
            )}
        </div>
    )
}

export default ProductCategory