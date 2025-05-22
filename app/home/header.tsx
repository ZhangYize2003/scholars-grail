import Link from 'next/link';

const Header = () => { 
    return (
        <header className="bg-gray-900 text-gray-300 p-4 shadow-md">
            <nav className="container mx-auto flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold hover:text-blue-100">
                Scholar's Grail
                </Link>
            </nav>
        </header>
    );
}

export default Header;