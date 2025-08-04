import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Users, Plus, Search, ThumbsUp, Reply, Flag, Clock } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: Date;
  likes: number;
  replies: Reply[];
  category: string;
}

interface Reply {
  id: string;
  content: string;
  author: string;
  timestamp: Date;
  likes: number;
}

const Community: React.FC = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'general'
  });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Load posts from localStorage if available
    const savedPosts = localStorage.getItem('communityPosts');
    if (savedPosts) {
      const parsedPosts = JSON.parse(savedPosts).map((post: any) => ({
        ...post,
        timestamp: new Date(post.timestamp),
        replies: post.replies.map((reply: any) => ({
          ...reply,
          timestamp: new Date(reply.timestamp)
        }))
      }));
      setPosts(parsedPosts);
    }
  }, []);

  const categories = [
    { id: 'all', name: 'All Topics', icon: '📋' },
    { id: 'general', name: 'General Help', icon: '❓' },
    { id: 'mobile', name: 'Mobile Devices', icon: '📱' },
    { id: 'computer', name: 'Computers', icon: '💻' },
    { id: 'apps', name: 'Apps & Software', icon: '📱' },
    { id: 'internet', name: 'Internet & Email', icon: '🌐' },
    { id: 'safety', name: 'Online Safety', icon: '🔒' }
  ];

  // Profanity filter - simple word list
  const profanityFilter = (text: string): boolean => {
    const badWords = ['spam', 'scam', 'inappropriate']; // Add more as needed
    const lowerText = text.toLowerCase();
    return badWords.some(word => lowerText.includes(word));
  };

  const handleNewPost = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for profanity
    if (profanityFilter(newPost.title) || profanityFilter(newPost.content)) {
      alert('Your post contains inappropriate content. Please revise and try again.');
      return;
    }

    const post: Post = {
      id: Date.now().toString(),
      title: newPost.title,
      content: newPost.content,
      author: 'You', // In a real app, this would be the logged-in user
      timestamp: new Date(),
      likes: 0,
      replies: [],
      category: newPost.category
    };

    setPosts([post, ...posts]);
    setNewPost({ title: '', content: '', category: 'general' });
    setShowNewPostForm(false);
  };

  const handleLike = (postId: string, replyId?: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        if (replyId) {
          return {
            ...post,
            replies: post.replies.map(reply =>
              reply.id === replyId ? { ...reply, likes: reply.likes + 1 } : reply
            )
          };
        } else {
          return { ...post, likes: post.likes + 1 };
        }
      }
      return post;
    }));
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <button
              onClick={() => setShowNewPostForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Community Forum</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Connect with other learners, ask questions, and share your experiences
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                        selectedCategory === category.id
                          ? 'bg-blue-100 text-blue-800'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="mr-2">{category.icon}</span>
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">Community Guidelines</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Be respectful and kind</li>
                  <li>• No spam or inappropriate content</li>
                  <li>• Help others when you can</li>
                  <li>• Stay on topic</li>
                  <li>• Report any issues</li>
                </ul>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Search Bar */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* New Post Form */}
              {showNewPostForm && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Post</h3>
                  <form onSubmit={handleNewPost} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={newPost.category}
                        onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {categories.slice(1).map(category => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input
                        type="text"
                        required
                        value={newPost.title}
                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="What's your question or topic?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                      <textarea
                        required
                        rows={4}
                        value={newPost.content}
                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe your question or share your thoughts..."
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Post
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewPostForm(false)}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Posts */}
              <div className="space-y-6">
                {filteredPosts.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No posts found. Be the first to start a conversation!</p>
                  </div>
                ) : (
                  filteredPosts.map(post => (
                    <div key={post.id} className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                          <div className="flex items-center text-sm text-gray-500 mb-3">
                            <span>{post.author}</span>
                            <span className="mx-2">•</span>
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{formatTimeAgo(post.timestamp)}</span>
                            <span className="mx-2">•</span>
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {categories.find(c => c.id === post.category)?.name}
                            </span>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Flag className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{post.content}</p>
                      
                      <div className="flex items-center justify-between border-t pt-4">
                        <button
                          onClick={() => handleLike(post.id)}
                          className="flex items-center text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          <span>{post.likes}</span>
                        </button>
                        <div className="flex items-center text-gray-500">
                          <Reply className="w-4 h-4 mr-1" />
                          <span>{post.replies.length} replies</span>
                        </div>
                      </div>

                      {/* Replies */}
                      {post.replies.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-3">
                          {post.replies.map(reply => (
                            <div key={reply.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center text-sm text-gray-500">
                                  <span className="font-medium">{reply.author}</span>
                                  <span className="mx-2">•</span>
                                  <span>{formatTimeAgo(reply.timestamp)}</span>
                                </div>
                                <button
                                  onClick={() => handleLike(post.id, reply.id)}
                                  className="flex items-center text-gray-400 hover:text-blue-600 transition-colors text-sm"
                                >
                                  <ThumbsUp className="w-3 h-3 mr-1" />
                                  <span>{reply.likes}</span>
                                </button>
                              </div>
                              <p className="text-gray-700">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;