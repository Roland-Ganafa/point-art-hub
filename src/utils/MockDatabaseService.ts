/**
 * MockDatabaseService.ts
 * 
 * This service provides mock database functionality for development purposes
 * when the Supabase connection is having issues. It simulates database operations
 * without actually connecting to Supabase.
 */

// Simple in-memory "database"
const mockDatabase: Record<string, any[]> = {
  profiles: [
    {
      id: 'mock-profile-id-12345',
      user_id: 'mock-user-id-12345',
      full_name: 'Admin User',
      role: 'admin',
      sales_initials: 'ADMIN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ],
  stationery: [],
  gift_store: [],
  embroidery: [],
  machines: [],
  art_services: [],
  stationery_sales: [],
  customers: []
};

/**
 * Class that simulates Supabase database functionality
 */
class MockDatabaseService {
  /**
   * Start a query on a table
   */
  from(tableName: string) {
    let selectedData = mockDatabase[tableName] || [];
    let filters: Array<(item: any) => boolean> = [];
    
    return {
      // Filter the data
      select: (columns: string | string[] = '*') => {
        return {
          // Apply equality filter
          eq: (column: string, value: any) => {
            filters.push((item) => item[column] === value);
            
            return {
              // Return a single result
              single: () => {
                const filteredData = selectedData.filter(item => 
                  filters.every(filter => filter(item))
                );
                
                return {
                  data: filteredData.length > 0 ? filteredData[0] : null,
                  error: null
                };
              },
              
              // Return multiple results
              then: (callback: (result: any) => void) => {
                const filteredData = selectedData.filter(item => 
                  filters.every(filter => filter(item))
                );
                
                callback({
                  data: filteredData,
                  error: null
                });
              }
            };
          },
          
          // Return all data
          then: (callback: (result: any) => void) => {
            callback({
              data: selectedData,
              error: null
            });
          },
          
          // Limit the results
          limit: (limit: number) => {
            selectedData = selectedData.slice(0, limit);
            
            return {
              // Return single item
              maybeSingle: () => {
                return {
                  data: selectedData.length > 0 ? selectedData[0] : null,
                  error: null
                };
              },
              
              // Chain more operations
              order: (column: string, options: { ascending?: boolean }) => {
                const ascending = options?.ascending ?? true;
                selectedData.sort((a, b) => {
                  if (ascending) {
                    return a[column] > b[column] ? 1 : -1;
                  } else {
                    return a[column] < b[column] ? 1 : -1;
                  }
                });
                
                return {
                  then: (callback: (result: any) => void) => {
                    callback({
                      data: selectedData,
                      error: null
                    });
                  }
                };
              },
              
              // Return all data
              then: (callback: (result: any) => void) => {
                callback({
                  data: selectedData,
                  error: null
                });
              }
            };
          },
          
          // Order the results
          order: (column: string, options: { ascending?: boolean }) => {
            const ascending = options?.ascending ?? true;
            selectedData.sort((a, b) => {
              if (ascending) {
                return a[column] > b[column] ? 1 : -1;
              } else {
                return a[column] < b[column] ? 1 : -1;
              }
            });
            
            return {
              // Chain more operations
              limit: (limit: number) => {
                selectedData = selectedData.slice(0, limit);
                
                return {
                  then: (callback: (result: any) => void) => {
                    callback({
                      data: selectedData,
                      error: null
                    });
                  }
                };
              },
              
              // Return all data
              then: (callback: (result: any) => void) => {
                callback({
                  data: selectedData,
                  error: null
                });
              }
            };
          },
        };
      },
      
      // Insert data
      insert: (data: any[]) => {
        // Add IDs if they don't exist
        const dataWithIds = data.map(item => ({
          id: item.id || `mock-${tableName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          created_at: item.created_at || new Date().toISOString(),
          ...item
        }));
        
        // Add to the mock database
        if (!mockDatabase[tableName]) {
          mockDatabase[tableName] = [];
        }
        
        mockDatabase[tableName].push(...dataWithIds);
        
        return {
          select: () => {
            return {
              single: () => {
                return {
                  data: dataWithIds[0],
                  error: null
                };
              }
            };
          }
        };
      },
      
      // Update data
      update: (data: Partial<any>) => {
        return {
          eq: (column: string, value: any) => {
            const index = mockDatabase[tableName]?.findIndex(item => item[column] === value);
            
            if (index !== -1 && mockDatabase[tableName]) {
              mockDatabase[tableName][index] = {
                ...mockDatabase[tableName][index],
                ...data,
                updated_at: new Date().toISOString()
              };
              
              return {
                select: () => {
                  return {
                    single: () => {
                      return {
                        data: mockDatabase[tableName][index],
                        error: null
                      };
                    }
                  };
                }
              };
            }
            
            return {
              select: () => {
                return {
                  single: () => {
                    return {
                      data: null,
                      error: { message: 'Record not found' }
                    };
                  }
                };
              }
            };
          }
        };
      },
      
      // Delete data
      delete: () => {
        return {
          eq: (column: string, value: any) => {
            if (mockDatabase[tableName]) {
              const initialLength = mockDatabase[tableName].length;
              mockDatabase[tableName] = mockDatabase[tableName].filter(
                item => item[column] !== value
              );
              
              const deletedCount = initialLength - mockDatabase[tableName].length;
              
              return {
                data: { count: deletedCount },
                error: null
              };
            }
            
            return {
              data: { count: 0 },
              error: null
            };
          }
        };
      }
    };
  }
}

// Export a singleton instance
export const mockDatabaseService = new MockDatabaseService();