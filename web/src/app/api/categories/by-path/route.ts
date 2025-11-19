import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

// Use the actual category name from the database
// No need for complex generation - just use what's stored in the database
function generateCategoryName(_path: string, dbName?: string): string {
  // Always prefer the database name - it's the source of truth
  if (dbName) {
    return dbName;
  }

  // Fallback to path if no name is available (shouldn't happen)
  return _path;
}

// Generate breadcrumbs by traversing the category tree from the database
async function generateBreadcrumbs(
  categoryId: string,
  categoryPath: string
): Promise<Array<{ name: string; path: string; href: string }>> {
  const breadcrumbs: Array<{ name: string; path: string; href: string }> = [];

  // Start with "Каталог" as the root
  breadcrumbs.push({ name: 'Каталог', path: '', href: '/catalog' });

  // Build path segments
  const pathSegments = categoryPath.split('/').filter(Boolean);

  // Fetch all categories along the path
  const pathParts: string[] = [];
  for (let i = 0; i < pathSegments.length; i++) {
    pathParts.push(pathSegments[i]);
    const currentPath = pathParts.join('/');

    const cat = await prisma.category.findFirst({
      where: { path: currentPath, isActive: true },
      select: { id: true, name: true, path: true },
    });

    if (cat) {
      breadcrumbs.push({
        name: cat.name,
        path: cat.path,
        href: `/catalog/${cat.path}`,
      });
    }
  }

  return breadcrumbs;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { ok: false, error: 'Требуется параметр пути' },
        { status: 400 }
      );
    }

    // Find category by exact path match (no hardcoded prefixes - works with any root category)
    const category = await prisma.category.findFirst({
      where: { path: path, isActive: true },
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

        const parentCategory = await prisma.category.findFirst({
          where: { path: parentPath, isActive: true },
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
          const breadcrumbs = await generateBreadcrumbs(
            parentCategory.id,
            parentCategory.path
          );

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
                path: child.path,
                href: `/catalog/${child.path}`,
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
                  path: sibling.path,
                  href: `/catalog/${sibling.path}`,
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
                    path: child.path,
                    href: `/catalog/${child.path}`,
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
        { ok: false, error: 'Категория не найдена' },
        { status: 404 }
      );
    }

    // Generate proper category name and breadcrumbs
    const displayName = generateCategoryName(category.path, category.name);
    const breadcrumbs = await generateBreadcrumbs(category.id, category.path);

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
          path: child.path,
          href: `/catalog/${child.path}`,
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
            path: sibling.path,
            href: `/catalog/${sibling.path}`,
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
              path: child.path,
              href: `/catalog/${child.path}`,
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

    // Fetch parent category information
    let parentCategory = null;
    if (category.parentId) {
      const parent = await prisma.category.findFirst({
        where: { id: category.parentId, isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          path: true,
          parentId: true,
        },
      });

      if (parent) {
        parentCategory = {
          id: parent.id,
          name: parent.name,
          path: parent.path,
          href: `/catalog/${parent.path}`,
        };
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
      parentCategory,
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
