import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';

interface Post {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date | any; // Ajuste para manejar Timestamp
}

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRoles(userData.roles || []);
          }
        } catch (error) {
          console.error("Error fetching user roles:", error);
        }
      }
    };

    fetchUserRoles();
  }, [currentUser]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);

      try {
        const token = await currentUser?.getIdToken();
        const response = await fetch('http://localhost:3000/api/posts', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }

        const postsData = await response.json();

        // Convertir Timestamps de Firestore a objetos de tipo Date
        const formattedPosts = postsData.map((post: any) => {
          const createdAt = post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000) : new Date();
          return {
            ...post,
            createdAt,
          } as Post;
        });

        setPosts(formattedPosts);
      } catch (error) {
        console.error("Error fetching posts: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentUser]);

  const handleDelete = async (postId: string) => {
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(`http://localhost:3000/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPosts(posts.filter((post) => post.id !== postId));
      } else {
        console.error('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const getAuthorInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (loading) return <p className="text-center text-gray-600">Loading posts...</p>;

  return (
    <div className="max-w-4xl mx-auto p-4 mt-20 bg-white shadow-md rounded-lg">
      {posts.length > 0 ? (
        posts.map((post) => (
          <div key={post.id} className="post-item mb-6 p-4 bg-gray-100 rounded-lg shadow-md relative">
            <div className="flex items-center mb-2">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={post.authorName}
                  className="w-10 h-10 rounded-full mr-3"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center mr-3">
                  {getAuthorInitial(post.authorName)}
                </div>
              )}
              <div>
                <p className="text-gray-700 font-semibold">{post.authorName}</p>
                <p className="text-gray-500 text-sm">
                  {format(new Date(post.createdAt), 'dd MMMM yyyy, hh:mm a')}
                </p>
              </div>
            </div>
            <h3 className="text-2xl font-semibold mb-2">{post.title}</h3>
            <p className="text-gray-700 mb-4">{post.content}</p>
            {(currentUser?.uid === post.authorId || userRoles.includes('admin')) && (
              <button
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                onClick={() => handleDelete(post.id!)}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            )}
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 mt-10">
          <h3 className="text-3xl font-semibold mb-4">No posts to display</h3>
          <p className="text-lg">There are currently no posts available. Please check back later.</p>
        </div>
      )}
    </div>
  );
};

export default Feed;
