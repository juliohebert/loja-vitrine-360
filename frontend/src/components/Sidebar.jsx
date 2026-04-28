import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthHeaders, decodeToken } from '../utils/auth';
import { Menu, X } from 'lucide-react';
import API_URL from '../config/apiUrl';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [usuario, setUsuario] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [nomeLoja, setNomeLoja] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [configuracoesCarregadas, setConfiguracoesCarregadas] = useState(false);

  useEffect(() => {
    const carregarUsuario = () => {
      // Tentar pegar dados do usuário do localStorage primeiro
      let dadosUsuario = localStorage.getItem('user');
      
      // Se não existir, tentar pegar do campo 'usuario' (legado)
      if (!dadosUsuario) {
        dadosUsuario = localStorage.getItem('usuario');
      }
      
      if (dadosUsuario) {
        try {
          const usuarioObj = JSON.parse(dadosUsuario);
          setUsuario(usuarioObj);
        } catch (error) {
          console.error('Erro ao carregar usuário do localStorage:', error);
        }
      } else {
        // Se não existir no localStorage, tentar decodificar do token JWT
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const decoded = decodeToken(token);
            if (decoded) {
              setUsuario({
                nome: decoded.nome || decoded.email?.split('@')[0] || 'Usuário',
                email: decoded.email,
                funcao: decoded.funcao || decoded.role || 'usuario'
              });
            }
          } catch (error) {
            console.error('Erro ao decodificar token:', error);
          }
        }
      }
    };
    
    carregarUsuario();
    carregarConfiguracoes();
  }, [location]);

  const carregarConfiguracoes = async () => {
    try {
      const response = await fetch(API_URL + '/api/configurations', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        const configs = data.data;
        
        const logoConfig = configs.find(c => c.chave === 'logo_url');
        const nomeConfig = configs.find(c => c.chave === 'nome_loja');
        
        if (logoConfig?.valor) {
          setLogoUrl(logoConfig.valor);
        }
        if (nomeConfig?.valor) {
          setNomeLoja(nomeConfig.valor);
        } else {
          setNomeLoja('ModaStore'); // Valor padrão apenas se não houver configuração
        }
      } else {
        setNomeLoja('ModaStore'); // Valor padrão em caso de erro
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setNomeLoja('ModaStore'); // Valor padrão em caso de erro
    } finally {
      setConfiguracoesCarregadas(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false); // Fecha o menu ao clicar em um item
  };

  // Fecha o menu ao mudar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const menuItems = [
    {
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
        </svg>
      ),
      label: 'Dashboard'
    },
    {
      path: '/caixa',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z"/>
          <circle cx="16" cy="12" r="1.5"/>
        </svg>
      ),
      label: 'Caixa'
    },
    {
      path: '/vendas',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l-5.5 9h11z"/>
          <circle cx="17.5" cy="17.5" r="4.5"/>
          <path d="M3 13.5h8v8H3z"/>
        </svg>
      ),
      label: 'Vendas (PDV)'
    },
    {
      path: '/trocas',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
        </svg>
      ),
      label: 'Trocas'
    },
    {
      path: '/clientes',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      ),
      label: 'Clientes'
    },
    {
      path: '/fornecedores',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L3 7v11c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-9-5zm0 2.18l7 3.89V18H5V8.07l7-3.89zM12 11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      ),
      label: 'Fornecedores'
    },
    {
      path: '/ordens-compra',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      ),
      label: 'Ordens de Compra'
    },
    {
      path: '/pedidos-catalogo',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
        </svg>
      ),
      label: 'Pedidos Catálogo'
    },
    {
      path: '/contas',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.83.52 1.54 1.67 1.54 1.66 0 2.38-1.12 2.38-2.11 0-1.07-.72-1.64-2.07-2.11-1.49-.52-3.86-1.34-3.86-3.88 0-1.91 1.3-3.23 3.2-3.52V3h2.67v1.57c1.6.34 2.96 1.35 3.08 3.38h-1.96c-.12-.82-.63-1.38-1.78-1.38-1.14 0-1.98.68-1.98 1.61 0 .7.5 1.22 1.88 1.75 2.22.85 4.11 1.91 4.11 4.26.01 2.03-1.37 3.42-3.36 3.9z"/>
        </svg>
      ),
      label: 'Contas'
    },
    {
      path: '/products',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
        </svg>
      ),
      label: 'Produtos'
    },
    {
      path: '/estoque',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2z"/>
        </svg>
      ),
      label: 'Estoque'
    },
    {
      path: '/financeiro',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
        </svg>
      ),
      label: 'Financeiro'
    },
    {
      path: '/relatorios',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
        </svg>
      ),
      label: 'Relatórios'
    },
    {
      path: '/usuarios',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      ),
      label: 'Usuários',
      adminOnly: true
    },
    {
      path: '/admin/planos',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
      label: 'Planos',
      superAdminOnly: true
    },
    {
      path: '/admin/assinaturas',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
        </svg>
      ),
      label: 'Assinaturas',
      superAdminOnly: true
    },
    {
      path: '/configuracoes',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>
      ),
      label: 'Configurações'
    }
  ];

  return (
    <>
      {/* Botão Hambúrguer - Mobile Only */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-40 lg:hidden bg-primary text-white p-3 rounded-lg shadow-xl hover:bg-primary/90 transition-all active:scale-95"
        aria-label="Menu"
        style={{ touchAction: 'manipulation' }}
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay - Mobile Only */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[45] lg:hidden animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static
        top-0 left-0
        w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        flex flex-col h-screen
        z-[50]
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      <div className="flex-shrink-0 p-4">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2">
          {!configuracoesCarregadas ? (
            // Skeleton enquanto carrega
            <>
              <div className="w-8 h-8 bg-gray-200 animate-pulse rounded"></div>
              <span className="inline-block w-32 h-6 bg-gray-200 animate-pulse rounded"></span>
            </>
          ) : (
            <>
              {logoUrl ? (
                <img 
                  src={logoUrl.startsWith('http') ? logoUrl : API_URL + logoUrl} 
                  alt={nomeLoja || 'Logo'}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    // Se falhar, mostra o ícone padrão
                    e.target.style.display = 'none';
                    const svg = e.target.parentElement.querySelector('svg');
                    if (svg) svg.style.display = 'block';
                  }}
                />
              ) : null}
              <svg 
                className="text-primary text-3xl w-8 h-8" 
                fill="currentColor" 
                viewBox="0 0 24 24"
                style={{ display: logoUrl ? 'none' : 'block' }}
              >
                <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/>
              </svg>
              <h1 className="text-gray-800 dark:text-white text-lg font-bold">
                {nomeLoja || 'ModaStore'}
              </h1>
            </>
          )}
        </div>
      </div>

      {/* Menu - com scroll */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            {menuItems.map((item) => {
              // Ocultar menu de Usuários se não for admin
              if (item.adminOnly && usuario?.funcao !== 'admin') {
                return null;
              }
              
              // Ocultar menus de super-admin se não for super-admin
              if (item.superAdminOnly && usuario?.funcao !== 'super-admin') {
                return null;
              }
              
              return (
                <div
                  key={item.path}
                  onClick={() => handleMenuItemClick(item.path)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.icon}
                  <p className="text-sm font-medium leading-normal">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer da Sidebar - Usuário, Trocar de Loja e Sair */}
      <div className="flex-shrink-0 p-4">
        <div className="flex flex-col gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="bg-primary rounded-full w-10 h-10 flex items-center justify-center text-white font-semibold">
            {usuario?.nome ? usuario.nome.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 flex flex-col">
            <h1 className="text-gray-800 dark:text-white text-base font-medium leading-normal">
              {usuario?.nome || 'Usuário'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
              {usuario?.funcao === 'super-admin' 
                ? 'Super Admin' 
                : usuario?.funcao === 'admin' 
                ? 'Administrador' 
                : usuario?.funcao === 'gerente' 
                ? 'Gerente' 
                : usuario?.funcao === 'vendedor'
                ? 'Vendedor'
                : 'Usuário'}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors"
            title="Sair"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          </button>
        </div>
        <button
          onClick={() => {
            navigate('/selecionar-loja');
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Trocar de Loja"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Trocar de Loja</span>
        </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
