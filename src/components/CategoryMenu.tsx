import { Link } from 'gatsby';
import React from 'react';
import styled from 'styled-components';
import svgNew from '../../static/images/svg/categories/new.svg';
import { Category } from '../models';
import * as CategoryIcon from '../models/Icon';

const Nav = styled.nav`
  display: block;
  margin: 0;
  padding: 0 0 2em;
  @media screen and (max-width: ${props => props.theme.responsive.small}) {
    padding: 1em 0;
  }
`;

const CategoryItemList = styled.ul`
  display: flex;
  @media screen and (max-width: ${props => props.theme.responsive.small}) {
    margin: 0 -20px;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    ::-webkit-scrollbar {
      display: none;
    }
    &:after {
      content: '';
      width: 40px;
      flex: 0 0 auto;
    }
  }
`;

const CategoryItem = styled.li`
  width: 70px;
  margin: 0 20px 0 0;
  text-align: center;
  @media screen and (max-width: ${props => props.theme.responsive.small}) {
    width: 60px;
    flex: 0 0 auto;
    margin: 0 0 0 15px;
  }
  .category-item__link {
    color: #fff;
  }

  .category-item__image {
    padding: 2px;
    background: var(--categotyImgage);
    border-radius: 50%;
    position: relative;
    img {
      position: relative;
      background: var(--categotyImgage);
      border-radius: 50%;
      display: block;
      z-index: 2;
      .cactus {
        fill: #fff000;
      }
    }
    .cactus {
      fill: #fff000;
    }
  }
  .category-item__name {
    margin-top: 5px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--categoryColor);
    @media screen and (max-width: ${props => props.theme.responsive.small}) {
      font-size: 12px;
    }
  }
  &.active {
    .category-item__image:after {
      content: '';
      position: absolute;
      display: block;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: ${props => props.theme.colors.gradient};
      animation: rotating 2s linear infinite;
    }
    img {
      border: solid 1.5px var(--bg);
    }
    .cactus {
      fill: #fff;
    }
  }
  @keyframes rotating {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

function selectCategoryIcon(name: string) {
  switch (name) {
    case 'cactusYellow':
      return CategoryIcon.cactusYellow;
    case 'cactusRed':
      return CategoryIcon.cactusRed;
    case 'cactusGreen':
      return CategoryIcon.cactusGreen;
    case 'cactusBlue':
      return CategoryIcon.cactusBlue;
    case 'algorithmIcon':
      return CategoryIcon.algorithmIcon;
    case 'blogIcon':
      return CategoryIcon.blogIcon;
    case 'springIcon':
      return CategoryIcon.springIcon;
    case 'studyIcon':
      return CategoryIcon.studyIcon;
    case 'javaIcon':
      return CategoryIcon.javaIcon;
    case 'designIcon':
      return CategoryIcon.designIcon;
    case 'systemIcon':
      return CategoryIcon.systemIcon;
    case 'messageIcon':
      return CategoryIcon.messageIcon;
    case 'monitoringIcon':
      return CategoryIcon.monitoringIcon;
    case 'kotlinIcon':
      return CategoryIcon.kotlinIcon;
  }
}

interface CategoryLinkProps {
  categoryName: string;
  categoryIcon: string;
  categoryLink: string;
  path: string;
}

const CategoryLink = ({ categoryName, categoryIcon, categoryLink, path }: CategoryLinkProps) => {
  return (
    <CategoryItem className={categoryLink === path ? 'active' : undefined}>
      <Link to={categoryLink} className="category-item__link">
        <div className="category-item__image">
          <img src={categoryIcon} alt={categoryName} />
        </div>
        <div className="category-item__name">{categoryName}</div>
      </Link>
    </CategoryItem>
  );
};

interface CategoryMenuProps {
  location: any;
  categories: Category[];
}

const CategoryMenu = ({ location, categories }: CategoryMenuProps) => {
  const path = location.pathname;
  return (
    <Nav>
      <CategoryItemList>
        <CategoryLink key="최신 글" categoryName="최신 글" categoryIcon={svgNew} categoryLink="/" path={path} />
        {categories.map(category => {
          return (
            <CategoryLink
              key={category.name}
              categoryName={category.name}
              categoryIcon={selectCategoryIcon(category.icon)}
              categoryLink={category.link}
              path={path}
            />
          );
        })}
      </CategoryItemList>
    </Nav>
  );
};

export default CategoryMenu;
