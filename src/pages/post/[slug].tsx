import { GetStaticPaths, GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}
interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const pagePost = {
    ...post,
    first_publication_date: format(
      new Date(post.first_publication_date),
      'dd MMM yyyy',
      { locale: ptBR }
    ),
  };
  const totalWorlds = pagePost.data.content.reduce((acc, session) => {
    // eslint-disable-next-line no-param-reassign
    acc += session.heading.split(' ').length;
    const worlds = session.body.map(item => item.text.split(' ').length);
    // eslint-disable-next-line no-return-assign
    worlds.forEach(world => {
      acc += world;
    });
    return acc;
  }, 0);
  const timeToRead = Math.ceil(totalWorlds / 200);
  const router = useRouter();
  return !router.isFallback ? (
    <div className={styles.content}>
      <img src={pagePost.data.banner.url} alt="banner" />
      <div className={commonStyles.container}>
        <h1>{pagePost.data.title}</h1>
        <div className={commonStyles.info}>
          <span>
            <FiCalendar width="15" />
            {pagePost.first_publication_date.toString()}
          </span>
          <span>
            <FiUser />
            {pagePost.data.author}
          </span>
          <span>
            <FiClock />
            {`${timeToRead} min`}
          </span>
        </div>
        {pagePost.data.content.map(session => (
          <article key={session.heading} className={styles.session}>
            <h2>{session.heading}</h2>
            <div
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(session.body),
              }}
            />
          </article>
        ))}
      </div>
    </div>
  ) : (
    <div>Carregando...</div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 1,
    }
  );
  const paths = response.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });
  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const post = await prismic.getByUID('post', String(slug), {});
  return {
    props: {
      post,
    },
    revalidate: 60 * 60,
  };
  // TODO
};
