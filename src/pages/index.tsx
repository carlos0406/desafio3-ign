import { GetStaticProps } from 'next';
import { FiUser, FiCalendar } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import Link from 'next/link';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const formattedPosts = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        { locale: ptBR }
      ),
    };
  });
  const [nextPage, setNextpage] = useState<string | null>(
    postsPagination.next_page
  );
  const [posts, setPosts] = useState<Post[]>(formattedPosts);
  function loadMorePosts(): void {
    fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        const newFormattedData = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: format(
              new Date(post.first_publication_date),
              'dd MMM yyyy',
              { locale: ptBR }
            ),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });
        setNextpage(data.next_page);
        console.log(data.next_page);
        setPosts([...posts, ...newFormattedData]);
      });
  }

  return (
    <div className={`${commonStyles.container} ${styles.content}`}>
      <main>
        {posts.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <a className={styles.post}>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <footer className={commonStyles.info}>
                <span>
                  <FiCalendar width="15" />
                  {post.first_publication_date.toString()}
                </span>
                <span>
                  <FiUser />
                  {post.data.author}
                </span>
              </footer>
            </a>
          </Link>
        ))}
        {nextPage && (
          <button type="button" onClick={loadMorePosts}>
            Carregar mais posts
          </button>
        )}
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 1,
    }
  );
  const posts = response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: response.next_page,
      },
    },
  };
};
