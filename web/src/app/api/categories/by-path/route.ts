import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

// Generate proper category name based on path and database name
function generateCategoryName(path: string, dbName?: string): string {
  const segments = path.split('/');

  // Handle different path patterns
  if (segments.length === 2) {
    // obuv/womens -> Женская обувь
    const gender = segments[1];
    if (gender === 'womens') return 'Женская обувь';
    if (gender === 'mens') return 'Мужская обувь';
    if (gender === 'girls') return 'Обувь для девочек';
    if (gender === 'boys') return 'Обувь для мальчиков';
  }

  if (segments.length === 3) {
    // obuv/womens/autumn -> Женская осенняя обувь
    const gender = segments[1];
    const season = segments[2];

    let genderName = '';
    if (gender === 'womens') genderName = 'Женская';
    if (gender === 'mens') genderName = 'Мужская';
    if (gender === 'girls') genderName = 'Детская (девочки)';
    if (gender === 'boys') genderName = 'Детская (мальчики)';

    let seasonName = '';
    if (season === 'autumn') seasonName = 'осенняя';
    if (season === 'winter') seasonName = 'зимняя';
    if (season === 'spring') seasonName = 'весенняя';
    if (season === 'summer') seasonName = 'летняя';

    return `${genderName} ${seasonName} обувь`;
  }

  // For deeper categories (4+ levels), use specific product type mappings
  if (segments.length >= 4) {
    const lastSegment = segments[segments.length - 1];

    // Specific product type mappings
    const productTypeMap: Record<string, string> = {
      ugg: 'Угги',
      sneakers: 'Кроссовки',
      boots: 'Ботинки',
      sandals: 'Сандалии',
      heels: 'Туфли на каблуке',
      flats: 'Балетки',
      slippers: 'Тапочки',
      sports: 'Спортивная обувь',
      casual: 'Повседневная обувь',
      formal: 'Официальная обувь',
    };

    if (productTypeMap[lastSegment]) {
      return productTypeMap[lastSegment];
    }

    // If database name is descriptive and different from the last segment, use it
    if (dbName && dbName !== lastSegment && dbName.length > 2) {
      return dbName;
    }

    // Fallback: capitalize the last segment
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  }

  // Fallback to database name or original path
  return dbName || path;
}

// Generate breadcrumbs from path with human-readable names
function generateBreadcrumbs(path: string) {
  const segments = path.split('/');
  const breadcrumbs = [];

  // Always start with "Обувь"
  breadcrumbs.push({ name: 'Обувь', path: 'obuv', href: '/catalog' });

  if (segments.length >= 2) {
    const gender = segments[1];
    let genderName = '';
    let genderPath = '';

    if (gender === 'womens') {
      genderName = 'Женская обувь';
      genderPath = 'womens';
    } else if (gender === 'mens') {
      genderName = 'Мужская обувь';
      genderPath = 'mens';
    } else if (gender === 'girls') {
      genderName = 'Обувь для девочек';
      genderPath = 'girls';
    } else if (gender === 'boys') {
      genderName = 'Обувь для мальчиков';
      genderPath = 'boys';
    }

    if (genderName) {
      breadcrumbs.push({
        name: genderName,
        path: genderPath,
        href: `/catalog/${genderPath}`,
      });
    }
  }

  if (segments.length >= 3) {
    const season = segments[2];
    let seasonName = '';

    if (season === 'autumn') seasonName = 'Осень';
    if (season === 'winter') seasonName = 'Зима';
    if (season === 'spring') seasonName = 'Весна';
    if (season === 'summer') seasonName = 'Лето';

    if (seasonName) {
      breadcrumbs.push({
        name: seasonName,
        path: segments.slice(0, 3).join('/'),
        href: `/catalog/${segments.slice(1, 3).join('/')}`,
      });
    }
  }

  // For deeper levels (4+), add the product type
  if (segments.length >= 4) {
    const lastSegment = segments[segments.length - 1];

    // Use the same product type mapping as in generateCategoryName
    const productTypeMap: Record<string, string> = {
      ugg: 'Угги',
      sneakers: 'Кроссовки',
      boots: 'Ботинки',
      sandals: 'Сандалии',
      heels: 'Туфли на каблуке',
      flats: 'Балетки',
      slippers: 'Тапочки',
      sports: 'Спортивная обувь',
      casual: 'Повседневная обувь',
      formal: 'Официальная обувь',
    };

    const productName =
      productTypeMap[lastSegment] ||
      lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);

    breadcrumbs.push({
      name: productName,
      path: path,
      href: `/catalog/${path.replace(/^obuv\//, '')}`,
    });
  }

  return breadcrumbs;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { ok: false, error: 'Path parameter is required' },
        { status: 400 }
      );
    }

    const dbPath = `obuv/${path}`;
    const category = await prisma.category.findFirst({
      where: { path: dbPath, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        path: true,
        parentId: true,
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            path: true,
            _count: {
              select: {
                products: true,
              },
            },
            children: {
              where: { isActive: true },
              select: {
                id: true,
              },
            },
          },
          orderBy: { sort: 'asc' },
        },
      },
    });

    if (!category) {
      // Try to find the parent category by removing the last segment
      const pathSegments = path.split('/');
      if (pathSegments.length > 1) {
        const parentPath = pathSegments.slice(0, -1).join('/');
        const dbParentPath = `obuv/${parentPath}`;

        const parentCategory = await prisma.category.findFirst({
          where: { path: dbParentPath, isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            path: true,
            parentId: true,
            children: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                slug: true,
                path: true,
                _count: {
                  select: {
                    products: true,
                  },
                },
                children: {
                  where: { isActive: true },
                  select: {
                    id: true,
                  },
                },
              },
              orderBy: { sort: 'asc' },
            },
          },
        });

        if (parentCategory) {
          // Generate proper category name and breadcrumbs for parent
          const displayName = generateCategoryName(
            parentCategory.path,
            parentCategory.name
          );
          const breadcrumbs = generateBreadcrumbs(parentCategory.path);

          // Format subcategories for frontend - calculate total products including subcategories
          const subcategoriesWithTotals = await Promise.all(
            parentCategory.children.map(async child => {
              const totalProducts = await prisma.product.count({
                where: {
                  category: {
                    OR: [
                      { id: child.id },
                      { parentId: child.id },
                      { parent: { parentId: child.id } },
                      { parent: { parent: { parentId: child.id } } },
                      {
                        parent: { parent: { parent: { parentId: child.id } } },
                      },
                    ],
                  },
                  isActive: true,
                },
              });

              return {
                id: child.id,
                name: child.name,
                path: child.path.replace(/^obuv\//, ''),
                href: `/catalog/${child.path.replace(/^obuv\//, '')}`,
                totalProducts,
                hasChildren: child.children.length > 0,
              };
            })
          );

          const subcategories = subcategoriesWithTotals.filter(
            cat => cat.totalProducts > 0
          );

          // Fetch sibling categories for parent
          let siblingCategories: Array<{
            id: string;
            name: string;
            path: string;
            href: string;
            hasChildren: boolean;
          }> = [];
          if (parentCategory.parentId) {
            const siblings = await prisma.category.findMany({
              where: {
                parentId: parentCategory.parentId,
                isActive: true,
                id: { not: parentCategory.id },
              },
              select: {
                id: true,
                name: true,
                slug: true,
                path: true,
                _count: {
                  select: {
                    products: true,
                  },
                },
                children: {
                  where: { isActive: true },
                  select: {
                    id: true,
                  },
                },
              },
              orderBy: { sort: 'asc' },
            });

            // Calculate total products for siblings including subcategories
            const siblingsWithTotals = await Promise.all(
              siblings.map(async sibling => {
                const totalProducts = await prisma.product.count({
                  where: {
                    category: {
                      OR: [
                        { id: sibling.id },
                        { parentId: sibling.id },
                        { parent: { parentId: sibling.id } },
                        { parent: { parent: { parentId: sibling.id } } },
                        {
                          parent: {
                            parent: { parent: { parentId: sibling.id } },
                          },
                        },
                      ],
                    },
                    isActive: true,
                  },
                });

                return {
                  id: sibling.id,
                  name: sibling.name,
                  path: sibling.path.replace(/^obuv\//, ''),
                  href: `/catalog/${sibling.path.replace(/^obuv\//, '')}`,
                  totalProducts,
                  hasChildren: sibling.children.length > 0,
                };
              })
            );

            siblingCategories = siblingsWithTotals.filter(
              sibling => sibling.totalProducts > 0
            );
          }

          // Get parent's children for navigation (same as above)
          let parentChildren: Array<{
            id: string;
            name: string;
            path: string;
            href: string;
            hasChildren: boolean;
          }> = [];
          if (parentCategory.parentId) {
            const grandparent = await prisma.category.findFirst({
              where: { id: parentCategory.parentId, isActive: true },
              select: {
                children: {
                  where: { isActive: true },
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    path: true,
                    _count: {
                      select: {
                        products: true,
                      },
                    },
                    children: {
                      where: { isActive: true },
                      select: {
                        id: true,
                      },
                    },
                  },
                  orderBy: { sort: 'asc' },
                },
              },
            });

            if (grandparent) {
              // Calculate total products for parent children including subcategories
              const parentChildrenWithTotals = await Promise.all(
                grandparent.children.map(async child => {
                  const totalProducts = await prisma.product.count({
                    where: {
                      category: {
                        OR: [
                          { id: child.id },
                          { parentId: child.id },
                          { parent: { parentId: child.id } },
                          { parent: { parent: { parentId: child.id } } },
                          {
                            parent: {
                              parent: { parent: { parentId: child.id } },
                            },
                          },
                        ],
                      },
                      isActive: true,
                    },
                  });

                  return {
                    id: child.id,
                    name: child.name,
                    path: child.path.replace(/^obuv\//, ''),
                    href: `/catalog/${child.path.replace(/^obuv\//, '')}`,
                    totalProducts,
                    hasChildren: child.children.length > 0,
                  };
                })
              );

              parentChildren = parentChildrenWithTotals.filter(
                child => child.totalProducts > 0
              );
            }
          }

          return NextResponse.json({
            ok: true,
            ...parentCategory,
            displayName,
            breadcrumbs,
            subcategories,
            siblingCategories,
            parentChildren,
            isParentCategory: true,
            originalPath: path,
          });
        }
      }

      return NextResponse.json(
        { ok: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Generate proper category name and breadcrumbs
    const displayName = generateCategoryName(category.path, category.name);
    const breadcrumbs = generateBreadcrumbs(category.path);

    // Format subcategories for frontend - calculate total products including subcategories
    const subcategoriesWithTotals = await Promise.all(
      category.children.map(async child => {
        // Get total product count including all subcategories
        const totalProducts = await prisma.product.count({
          where: {
            category: {
              OR: [
                { id: child.id },
                { parentId: child.id },
                { parent: { parentId: child.id } },
                { parent: { parent: { parentId: child.id } } },
                { parent: { parent: { parent: { parentId: child.id } } } },
              ],
            },
            isActive: true,
          },
        });

        return {
          id: child.id,
          name: child.name,
          path: child.path.replace(/^obuv\//, ''),
          href: `/catalog/${child.path.replace(/^obuv\//, '')}`,
          totalProducts,
          hasChildren: child.children.length > 0,
        };
      })
    );

    // Filter out categories with 0 products
    const subcategories = subcategoriesWithTotals.filter(
      cat => cat.totalProducts > 0
    );

    // Fetch sibling categories (same level)
    let siblingCategories: Array<{
      id: string;
      name: string;
      path: string;
      href: string;
      hasChildren: boolean;
    }> = [];
    if (category.parentId) {
      const siblings = await prisma.category.findMany({
        where: {
          parentId: category.parentId,
          isActive: true,
          id: { not: category.id }, // Exclude current category
        },
        select: {
          id: true,
          name: true,
          slug: true,
          path: true,
          _count: {
            select: {
              products: true,
            },
          },
          children: {
            where: { isActive: true },
            select: {
              id: true,
            },
          },
        },
        orderBy: { sort: 'asc' },
      });

      // Calculate total products for siblings including subcategories
      const siblingsWithTotals = await Promise.all(
        siblings.map(async sibling => {
          const totalProducts = await prisma.product.count({
            where: {
              category: {
                OR: [
                  { id: sibling.id },
                  { parentId: sibling.id },
                  { parent: { parentId: sibling.id } },
                  { parent: { parent: { parentId: sibling.id } } },
                  { parent: { parent: { parent: { parentId: sibling.id } } } },
                ],
              },
              isActive: true,
            },
          });

          return {
            id: sibling.id,
            name: sibling.name,
            path: sibling.path.replace(/^obuv\//, ''),
            href: `/catalog/${sibling.path.replace(/^obuv\//, '')}`,
            totalProducts,
            hasChildren: sibling.children.length > 0,
          };
        })
      );

      siblingCategories = siblingsWithTotals.filter(
        sibling => sibling.totalProducts > 0
      );
    }

    // Get parent's children for navigation
    let parentChildren: Array<{
      id: string;
      name: string;
      path: string;
      href: string;
      hasChildren: boolean;
    }> = [];
    if (category.parentId) {
      const parent = await prisma.category.findFirst({
        where: { id: category.parentId, isActive: true },
        select: {
          children: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              slug: true,
              path: true,
              _count: {
                select: {
                  products: true,
                },
              },
              children: {
                where: { isActive: true },
                select: {
                  id: true,
                },
              },
            },
            orderBy: { sort: 'asc' },
          },
        },
      });

      if (parent) {
        // Calculate total products for parent children including subcategories
        const parentChildrenWithTotals = await Promise.all(
          parent.children.map(async child => {
            const totalProducts = await prisma.product.count({
              where: {
                category: {
                  OR: [
                    { id: child.id },
                    { parentId: child.id },
                    { parent: { parentId: child.id } },
                    { parent: { parent: { parentId: child.id } } },
                    { parent: { parent: { parent: { parentId: child.id } } } },
                  ],
                },
                isActive: true,
              },
            });

            return {
              id: child.id,
              name: child.name,
              path: child.path.replace(/^obuv\//, ''),
              href: `/catalog/${child.path.replace(/^obuv\//, '')}`,
              totalProducts,
              hasChildren: child.children.length > 0,
            };
          })
        );

        parentChildren = parentChildrenWithTotals.filter(
          child => child.totalProducts > 0
        );
      }
    }

    return NextResponse.json({
      ok: true,
      ...category,
      displayName,
      breadcrumbs,
      subcategories,
      siblingCategories,
      parentChildren,
    });
  } catch (error) {
    console.error('Category by path API error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch category',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
