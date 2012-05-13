Webapp::Application.routes.draw do
  match '/upload' => 'application#upload'
  root to: 'application#index'
end
