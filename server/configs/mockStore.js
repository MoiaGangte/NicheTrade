import mongoose from 'mongoose';

export const isDBConnected = () => mongoose.connection.readyState === 1;

export const mockCategories = [
    'Textbooks',
    'Electronics',
    'Calculators',
    'Engineering Tools',
    'Hostel Essentials',
    'Clothing',
    'Sports & Fitness',
    'Bicycles'
];

export const mockProducts = [
    {
        _id: '67a000000000000000000001',
        name: 'Casio fx-991EX Scientific Calculator',
        category: 'Calculators',
        categories: ['Calculators', 'Electronics', 'Engineering Tools'],
        price: 1400,
        offerPrice: 850,
        stockQuantity: 2,
        inStock: true,
        isVisible: true,
        image: [
            'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80'
        ],
        description: ['Gently used Casio scientific calculator in pristine condition. Essential for engineering examinations.'],
        sellerId: {
            _id: '67b000000000000000000001',
            name: 'Rahul Sharma',
            department: 'Mechanical Engineering',
            isActive: true,
            isApproved: true
        },
        createdAt: new Date().toISOString()
    },
    {
        _id: '67a000000000000000000002',
        name: 'Higher Engineering Mathematics - B.S. Grewal (44th Ed)',
        category: 'Textbooks',
        categories: ['Textbooks', 'Engineering Tools'],
        price: 950,
        offerPrice: 480,
        stockQuantity: 1,
        inStock: true,
        isVisible: true,
        image: [
            'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'
        ],
        description: ['Complete 44th edition, clean pages with no markings. Great for Sem 1 to 4 math courses.'],
        sellerId: {
            _id: '67b000000000000000000002',
            name: 'Priya Patel',
            department: 'Computer Science',
            isActive: true,
            isApproved: true
        },
        createdAt: new Date().toISOString()
    },
    {
        _id: '67a000000000000000000003',
        name: 'Hero Sprint 26T Mountain Bicycle',
        category: 'Bicycles',
        categories: ['Bicycles', 'Sports & Fitness'],
        price: 6500,
        offerPrice: 3200,
        stockQuantity: 1,
        inStock: true,
        isVisible: true,
        image: [
            'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80'
        ],
        description: ['Single-speed campus commuter bike. Brand new tires and cable lock included.'],
        sellerId: {
            _id: '67b000000000000000000003',
            name: 'Ankit Verma',
            department: 'Civil Engineering',
            isActive: true,
            isApproved: true
        },
        createdAt: new Date().toISOString()
    },
    {
        _id: '67a000000000000000000004',
        name: 'Mini Drafter & Engineering Drawing Set',
        category: 'Engineering Tools',
        categories: ['Engineering Tools'],
        price: 1100,
        offerPrice: 550,
        stockQuantity: 3,
        inStock: true,
        isVisible: true,
        image: [
            'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80'
        ],
        description: ['Omega mini drafter with sheet clips, scales, and compass container box.'],
        sellerId: {
            _id: '67b000000000000000000001',
            name: 'Rahul Sharma',
            department: 'Mechanical Engineering',
            isActive: true,
            isApproved: true
        },
        createdAt: new Date().toISOString()
    },
    {
        _id: '67a000000000000000000005',
        name: 'Campus Navy Fleece Hoodie (Size L)',
        category: 'Clothing',
        categories: ['Clothing'],
        price: 1299,
        offerPrice: 650,
        stockQuantity: 1,
        inStock: true,
        isVisible: true,
        image: [
            'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80'
        ],
        description: ['Comfortable heavy cotton fleece hoodie. Worn twice, like new.'],
        sellerId: {
            _id: '67b000000000000000000002',
            name: 'Priya Patel',
            department: 'Computer Science',
            isActive: true,
            isApproved: true
        },
        createdAt: new Date().toISOString()
    }
];

export const mockLostFoundPosts = [
    {
        _id: '67c000000000000000000001',
        itemName: 'Stainless Steel Water Bottle (Milton 1L)',
        placeFound: 'Central Library, 2nd Floor Reading Hall',
        postType: 'found',
        foundDate: new Date().toISOString(),
        foundAt: new Date().toISOString(),
        description: 'Silver metallic bottle left on Table 14 after evening study hours.',
        image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
        founderName: 'Security Desk',
        founderMobile: '9876543210',
        founderDepartment: 'Campus Security',
        createdAt: new Date().toISOString()
    },
    {
        _id: '67c000000000000000000002',
        itemName: 'Blue USB Flash Drive (SanDisk 64GB)',
        placeFound: 'Computer Lab 3 (Block B)',
        postType: 'found',
        foundDate: new Date().toISOString(),
        foundAt: new Date().toISOString(),
        description: 'Blue SanDisk pendrive attached to an anime lanyard key ring.',
        image: 'https://images.unsplash.com/photo-1618761714954-0b8cd0026356?w=600&auto=format&fit=crop&q=80',
        founderName: 'Lab Assistant',
        founderMobile: '9876543211',
        founderDepartment: 'IT Services',
        createdAt: new Date().toISOString()
    },
    {
        _id: '67c000000000000000000003',
        itemName: 'Noise Cancelling Wireless Earbuds Case',
        placeFound: 'Sports Complex / Gym',
        postType: 'lost',
        foundDate: new Date().toISOString(),
        foundAt: new Date().toISOString(),
        description: 'Black charging case with a small scratch on top. Lost around 6 PM.',
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
        founderName: 'Aman Gupta',
        founderMobile: '9876543212',
        founderDepartment: 'Electrical Eng',
        createdAt: new Date().toISOString()
    }
];

export const mockItemRequests = [
    {
        _id: '67d000000000000000000001',
        itemName: 'Lab Coat (White, Size M/L)',
        description: 'Need a white chemistry lab coat for Wednesday practicals. Will return same day.',
        promiseAmount: 150,
        image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&auto=format&fit=crop&q=80',
        requesterId: {
            _id: '67e000000000000000000001',
            name: 'Sneha Nair',
            email: 'sneha@campus.edu',
            department: 'Biotechnology'
        },
        confirmations: [],
        createdAt: new Date().toISOString()
    },
    {
        _id: '67d000000000000000000002',
        itemName: 'HDMI to VGA Adapter',
        description: 'Urgent for project presentation in Seminar Hall 2 at 2 PM.',
        promiseAmount: 200,
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
        requesterId: {
            _id: '67e000000000000000000002',
            name: 'Karan Mehra',
            email: 'karan@campus.edu',
            department: 'Electronics'
        },
        confirmations: [],
        createdAt: new Date().toISOString()
    }
];
